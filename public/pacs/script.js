/* ════════════════════════════════════════════════════════════════
   Neuro-IRM-viewer — script.js
   ════════════════════════════════════════════════════════════════ */

/* ── DICOM STATE ── */
let dicomFiles   = [];
let dicomSlices  = [];
let dicomSeries  = [];
let currentSlice = 0;
let dicomMeta    = {};

/* ── DRAG & DROP ── */
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dicomDropZone').classList.add('drag-over');
}

function handleDragLeave(e) {
  document.getElementById('dicomDropZone').classList.remove('drag-over');
}

async function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dicomDropZone').classList.remove('drag-over');

  const items = e.dataTransfer.items;
  const files = [];

  // readEntries ne retourne que 100 entrées max — il faut boucler
  async function readAllEntries(reader) {
    const all = [];
    while (true) {
      const batch = await new Promise(resolve => reader.readEntries(resolve));
      if (!batch || batch.length === 0) break;
      all.push(...batch);
    }
    return all;
  }

  async function traverse(entry) {
    if (!entry) return;
    if (entry.isFile) {
      const file = await new Promise(resolve => entry.file(resolve));
      // Accepter tout fichier — on laisse parseDicom décider si c'est valide
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await readAllEntries(reader);
      for (const child of entries) {
        await traverse(child);
      }
    }
  }

  if (items) {
    for (const item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry) await traverse(entry);
    }
  }

  if (files.length > 0) processDicomFiles(files);
}

function handleDicomFiles(files) {
  processDicomFiles(Array.from(files));
}

/* ════════════════════════════════════════════════════════════════
   DICOM PARSER
   ════════════════════════════════════════════════════════════════ */
function parseDicom(buf) {
  const u8  = new Uint8Array(buf);
  const dv  = new DataView(buf);
  const len = buf.byteLength;
  const dec = new TextDecoder('latin1');

  const str = (off, l) => {
    l = Math.min(l, len - off);
    if (l <= 0) return '';
    return dec.decode(u8.slice(off, off + l)).replace(/[\x00\s]+$/g, '').trim();
  };

  const hasPreamble = len >= 132 &&
    u8[128]===0x44 && u8[129]===0x49 && u8[130]===0x43 && u8[131]===0x4D;

  const startPos = hasPreamble ? 132 : 0;

  // Detect Explicit vs Implicit VR
  let explicitVR = true;
  if (startPos + 6 <= len) {
    const g0 = dv.getUint16(startPos, true);
    if (g0 !== 0x0002) {
      const c0 = u8[startPos + 4], c1 = u8[startPos + 5];
      explicitVR = (c0 >= 65 && c0 <= 90 && c1 >= 65 && c1 <= 90);
    }
  }

  const LONG32 = new Set(['OB','OW','SQ','UC','UN','UR','UT','OF','OL','OD','SV','UV']);

  const result = {
    rows:0, cols:0, bpp:16, sign:0, rs:1.0, ri:0.0, wc:null, ww:null,
    inst:0, pn:'', sd:'', mod:'MR', st:'',
    seriesDesc:'', seriesUID:'', seriesNum:0, patientId:'',
    pixOffset:null, pixLength:0, buf
  };

  // Read a single tag at pos, returns tag info or null
  function readTag(pos) {
    if (pos + 4 > len) return null;
    const group = dv.getUint16(pos, true);
    const elem  = dv.getUint16(pos + 2, true);

    // FFFE tags (item/delimiter) always use 4-byte implicit length
    if (group === 0xFFFE) {
      if (pos + 8 > len) return null;
      const itemLen = dv.getUint32(pos + 4, true) >>> 0;
      return {
        group, elem, vr:'',
        dataStart: pos + 8,
        dataLen:   itemLen,
        nextPos:   itemLen === 0xFFFFFFFF ? pos + 8 : pos + 8 + itemLen,
        isFFFE: true,
        isUndef: itemLen === 0xFFFFFFFF
      };
    }

    let vr = '', dataStart, dataLen;

    if (explicitVR) {
      if (pos + 6 > len) return null;
      const c0 = u8[pos+4], c1 = u8[pos+5];
      if (c0 >= 65 && c0 <= 90 && c1 >= 65 && c1 <= 90) {
        vr = String.fromCharCode(c0, c1);
        if (LONG32.has(vr)) {
          if (pos + 12 > len) return null;
          dataLen   = dv.getUint32(pos+8, true) >>> 0;
          dataStart = pos + 12;
        } else {
          if (pos + 8 > len) return null;
          dataLen   = dv.getUint16(pos+6, true);
          dataStart = pos + 8;
        }
      } else {
        // Fallback to implicit
        if (pos + 8 > len) return null;
        dataLen   = dv.getUint32(pos+4, true) >>> 0;
        dataStart = pos + 8;
      }
    } else {
      if (pos + 8 > len) return null;
      dataLen   = dv.getUint32(pos+4, true) >>> 0;
      dataStart = pos + 8;
    }

    const isUndef = dataLen === 0xFFFFFFFF;
    return {
      group, elem, vr, dataStart,
      dataLen: isUndef ? 0 : dataLen,
      nextPos: isUndef ? dataStart : Math.min(dataStart + dataLen, len),
      isUndef
    };
  }

  // Skip an undefined-length sequence by scanning for (FFFE,E0DD)
  function skipUndefSeq(pos) {
    let depth = 1, p = pos;
    while (p + 4 <= len && depth > 0) {
      if (dv.getUint16(p, true) === 0xFFFE) {
        const e = dv.getUint16(p+2, true);
        const l = p+8 <= len ? (dv.getUint32(p+4, true) >>> 0) : 0xFFFFFFFF;
        if      (e === 0xE000 && l === 0xFFFFFFFF) { depth++; p += 8; }
        else if (e === 0xE000)                      { p += 8 + l; }
        else if (e === 0xE00D)                      { p += 8; }
        else if (e === 0xE0DD)                      { p += 8; depth--; }
        else                                         { p++; }
      } else { p++; }
    }
    return p;
  }

  let pos = startPos;
  let iter = 0;

  while (pos < len && iter++ < 500000) {
    const t = readTag(pos);
    if (!t) break;

    const { group, elem, vr, dataStart, dataLen, nextPos } = t;

    // Skip FFFE items/delimiters silently
    if (t.isFFFE) { pos = nextPos; continue; }

    // ── Pixel Data (7FE0,0010) ──────────────────────────────────
    if (group === 0x7FE0 && elem === 0x0010) {
      if (t.isUndef) {
        // Encapsulated: skip Basic Offset Table, read first fragment
        let p = dataStart;
        if (p + 8 <= len && dv.getUint16(p,true)===0xFFFE && dv.getUint16(p+2,true)===0xE000) {
          const l = dv.getUint32(p+4,true) >>> 0;
          p += 8 + (l === 0xFFFFFFFF ? 0 : l);
        }
        if (p + 8 <= len && dv.getUint16(p,true)===0xFFFE && dv.getUint16(p+2,true)===0xE000) {
          const l = dv.getUint32(p+4,true) >>> 0;
          result.pixOffset = p + 8;
          result.pixLength = l === 0xFFFFFFFF ? len-(p+8) : l;
        } else {
          result.pixOffset = p;
          result.pixLength = len - p;
        }
      } else {
        result.pixOffset = dataStart;
        result.pixLength = dataLen;
      }
      break;
    }

    // Skip undefined-length sequences entirely
    if (t.isUndef) { pos = skipUndefSeq(dataStart); continue; }

    // Safety: don't read past file
    if (dataStart + dataLen > len) { pos = nextPos; continue; }

    // ── Useful tags ─────────────────────────────────────────────
    const s   = () => str(dataStart, dataLen);
    const u16 = () => dataLen >= 2 ? dv.getUint16(dataStart, true) : 0;
    const ds  = () => { const v = parseFloat(s()); return isNaN(v) ? null : v; };

    if      (group===0x0008 && elem===0x0060) result.mod         = s() || 'MR';
    else if (group===0x0008 && elem===0x0020) result.sd          = s();
    else if (group===0x0008 && elem===0x0022) result.acqDate     = s();
    else if (group===0x0008 && elem===0x103E) result.seriesDesc  = s();
    else if (group===0x0010 && elem===0x0010) result.pn          = s();
    else if (group===0x0010 && elem===0x0020) result.patientId   = s();
    else if (group===0x0018 && elem===0x0015) result.bodyPart    = s();
    else if (group===0x0018 && elem===0x0050) result.st          = s();
    else if (group===0x0018 && elem===0x0080) { const n=ds(); if(n!==null) result.tr=n; }
    else if (group===0x0018 && elem===0x0081) { const n=ds(); if(n!==null) result.te=n; }
    else if (group===0x0018 && elem===0x0082) { const n=ds(); if(n!==null) result.ti=n; }
    else if (group===0x0018 && elem===0x1314) { const n=ds(); if(n!==null) result.fa=n; }
    else if (group===0x0018 && elem===0x0087) { const n=ds(); if(n!==null) result.fieldStrength=n; }
    else if (group===0x0018 && elem===0x1030) result.protocol    = s();
    else if (group===0x0028 && elem===0x0030) {
      const parts = s().split('\\');
      if (parts.length >= 1) result.pixelSpacing = parseFloat(parts[0]) || null;
    }
    else if (group===0x0020 && elem===0x000E) result.seriesUID   = s();
    else if (group===0x0020 && elem===0x0011) result.seriesNum   = parseInt(s()) || 0;
    else if (group===0x0020 && elem===0x0013) result.inst        = parseInt(s()) || 0;
    else if (group===0x0020 && elem===0x0032) {
      const parts = s().split('\\');
      result.imagePos = parts.map(v => parseFloat(v) || 0);
    }
    else if (group===0x0020 && elem===0x1041) { const n=ds(); if(n!==null) result.sliceLoc = n; }
    else if (group===0x0028 && elem===0x0010) result.rows        = u16();
    else if (group===0x0028 && elem===0x0011) result.cols        = u16();
    else if (group===0x0028 && elem===0x0100) result.bpp         = u16();
    else if (group===0x0028 && elem===0x0103) result.sign        = u16();
    else if (group===0x0028 && elem===0x1050) { const n=ds(); if(n!==null) result.wc=n; }
    else if (group===0x0028 && elem===0x1051) { const n=ds(); if(n!==null) result.ww=n; }
    else if (group===0x0028 && elem===0x1052) { const n=ds(); if(n!==null) result.ri=n; }
    else if (group===0x0028 && elem===0x1053) { const n=ds(); if(n!==null && n!==0) result.rs=n; }

    pos = nextPos;
    if (pos % 2 === 1) pos++;
  }

  // ── Validate ──────────────────────────────────────────────────
  if (result.pixOffset === null || result.pixLength === 0) {
    console.warn(`parseDicom: PixelData non trouvé — pos:${pos}/${len} rows:${result.rows} cols:${result.cols} iter:${iter} explicit:${explicitVR}`);
    return null;
  }
  if (!result.rows || !result.cols) {
    const px = result.pixLength / (result.bpp <= 8 ? 1 : 2);
    for (const side of [64,128,256,512,1024,2048]) {
      if (px === side * side) { result.rows = side; result.cols = side; break; }
    }
    if (!result.rows) {
      const s = Math.round(Math.sqrt(px));
      if (s * s === px) { result.rows = s; result.cols = s; }
    }
    if (!result.rows) {
      console.warn(`parseDicom: rows/cols introuvables px:${px}`);
      return null;
    }
  }

  return result;
}

/* ── PROCESS & LOAD FILES ── */
function processDicomFiles(files) {
  if (!files || files.length === 0) return;

  // ── Reset complet — permet de recharger un nouveau dossier ──
  dicomSlices  = [];
  dicomSeries  = [];
  dicomMeta    = {};
  panels.length = 0;
  activePanelIdx = 0;

  // Vider le viewer et supprimer le cadre patient
  const va = document.getElementById('viewerArea');
  if (va) {
    va.classList.remove('patient-loaded');
    document.getElementById('viewerPatientBar')?.remove();
    const overlay = document.getElementById('aiOverlay');
    va.innerHTML = '';
    if (overlay) va.appendChild(overlay);
  }
  // Vider worklist avec état vide
  const wlEl = document.getElementById('worklist');
  if (wlEl) wlEl.innerHTML = `<div id="wlEmpty" class="wl-empty-state">
    <div class="wl-empty-icon">⊕</div>
    <div class="wl-empty-text">Chargement en cours…</div>
  </div>`;
  const pdb = document.getElementById('sideSliceBlock');
  if (pdb) pdb.style.display = 'none';
  // Reset file input (pour pouvoir recharger le même dossier)
  const fi = document.getElementById('dicomFileInput');
  if (fi) fi.value = '';

  dicomFiles = files;

  const idle     = document.getElementById('dicomUploadIdle');
  const progress = document.getElementById('dicomUploadProgress');
  const done     = document.getElementById('dicomUploadDone');

  idle.style.display     = 'none';
  progress.style.display = 'block';
  done.style.display     = 'none';

  const toLoad = Array.from(files).filter(f => f.size > 256);
  const arc    = document.getElementById('dicomProgressArc');
  const pctEl  = document.getElementById('dicomProgressPct');
  const labelEl = document.getElementById('dicomProgressLabel');

  function setProgress(p, msg) {
    arc.style.strokeDashoffset = 94 * (1 - p / 100);
    pctEl.textContent   = Math.round(p) + '%';
    labelEl.textContent = msg;
  }

  setProgress(5, 'Lecture des fichiers…');

  let loaded = 0;
  const rawBuffers = new Array(toLoad.length);
  const BATCH = 30;
  let batchIdx = 0;

  function readBatch() {
    const end = Math.min(batchIdx + BATCH, toLoad.length);
    const promises = [];
    for (let i = batchIdx; i < end; i++) {
      const ii = i;
      promises.push(new Promise(res => {
        const r = new FileReader();
        r.onload  = e => { rawBuffers[ii] = e.target.result; loaded++; res(); };
        r.onerror = ()  => { loaded++; res(); };
        r.readAsArrayBuffer(toLoad[ii]);
      }));
    }
    Promise.all(promises).then(() => {
      setProgress(5 + (loaded / toLoad.length) * 50, `Lecture… ${loaded}/${toLoad.length}`);
      batchIdx = end;
      if (batchIdx < toLoad.length) setTimeout(readBatch, 0);
      else parseAll();
    });
  }

  function inferSeriesLabel(uid, slices) {
    const s = (uid + ' ' + (slices[0]?.seriesDesc || '')).toLowerCase();
    if (s.includes('flair'))                                              return 'FLAIR';
    if (s.includes('t1') && (s.includes('ce')||s.includes('gd')||s.includes('contrast'))) return 'T1WCE';
    if (s.includes('t1'))                                                 return 'T1W';
    if (s.includes('t2'))                                                 return 'T2W';
    if (s.includes('dwi') || s.includes('diff'))                          return 'DWI';
    if (s.includes('adc'))                                                return 'ADC';
    if (s.includes('swi') || s.includes('gre'))                           return 'SWI';
    return `Série ${slices[0]?.seriesNum || uid.slice(-6) || '???'}`;
  }

  async function parseAll() {
    setProgress(55, 'Décodage DICOM…');
    const allSlices = [];
    const PARSE_BATCH = 20;

    for (let i = 0; i < rawBuffers.length; i++) {
      const buf = rawBuffers[i];
      if (!buf) continue;
      const info = parseDicom(buf);
      if (!info) continue;
      info.buf = buf;
      info._filename = toLoad[i].name || '';
      if (!info.seriesUID) {
        const path  = toLoad[i].webkitRelativePath || toLoad[i].name || '';
        const parts = path.split('/');
        info.seriesUID = parts.length >= 2 ? parts[parts.length - 2] : ('s' + info.seriesNum);
      }
      allSlices.push(info);
      // Céder le thread tous les PARSE_BATCH fichiers
      if (i % PARSE_BATCH === 0) {
        setProgress(55 + (i / rawBuffers.length) * 25, `Décodage… ${i}/${rawBuffers.length}`);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    setProgress(80, 'Reconstruction des séries…');

    if (allSlices.length === 0) {
      // Diagnostic détaillé : retester le premier fichier avec logs verbeux
      console.group('Diagnostic DICOM — aucun fichier valide');
      console.log(`Fichiers testés : ${rawBuffers.filter(Boolean).length} / ${toLoad.length}`);
      for (let i = 0; i < Math.min(5, rawBuffers.length); i++) {
        const buf = rawBuffers[i];
        if (!buf) { console.log(`Fichier ${i}: buffer vide`); continue; }
        const u8  = new Uint8Array(buf);
        const hex = Array.from(u8.slice(0, 16)).map(b => b.toString(16).padStart(2,'0')).join(' ');
        const hasDICM = buf.byteLength >= 132 && u8[128]===0x44 && u8[129]===0x49 && u8[130]===0x43 && u8[131]===0x4D;
        console.log(`Fichier ${i} — ${toLoad[i]?.name} — ${buf.byteLength} octets — DICM:${hasDICM} — hex[0..15]: ${hex}`);
      }
      console.groupEnd();
      alert(`Aucun fichier DICOM valide (${toLoad.length} fichier(s) testés).\n\nConsultez la console F12 pour le diagnostic.`);
      finishUpload(progress, done, toLoad, true);
      return;
    }

    const seriesMap = new Map();
    for (const s of allSlices) {
      const key = s.seriesUID || String(s.seriesNum || 'unknown');
      if (!seriesMap.has(key)) seriesMap.set(key, []);
      seriesMap.get(key).push(s);
    }

    const seriesList = [];
    for (const [uid, slices] of seriesMap) {
      // ── Tri des coupes par ordre anatomique ──────────────────────
      // Priorité : SliceLocation → ImagePositionPatient Z → InstanceNumber → nom fichier
      slices.sort((a, b) => {
        // 1. SliceLocation (0020,1041) — le plus fiable
        if (a.sliceLoc !== undefined && b.sliceLoc !== undefined) {
          return a.sliceLoc - b.sliceLoc;
        }
        // 2. ImagePositionPatient Z (0020,0032 troisième composante)
        const azPos = a.imagePos?.[2], bzPos = b.imagePos?.[2];
        if (azPos !== undefined && bzPos !== undefined && azPos !== bzPos) {
          return azPos - bzPos;
        }
        // 3. InstanceNumber (0020,0013)
        if (a.inst !== b.inst) return a.inst - b.inst;
        // 4. Nom de fichier (fallback numérique)
        const aName = a._filename || '';
        const bName = b._filename || '';
        const aNum  = parseInt(aName.replace(/\D/g, '')) || 0;
        const bNum  = parseInt(bName.replace(/\D/g, '')) || 0;
        return aNum - bNum;
      });
      const rep  = slices[0];
      const desc = rep.seriesDesc || inferSeriesLabel(uid, slices);
      seriesList.push({ uid, desc, slices, rep });
    }
    seriesList.sort((a, b) => (a.rep.seriesNum || 0) - (b.rep.seriesNum || 0));

    dicomSeries  = seriesList;
    dicomSlices  = seriesList[0]?.slices || [];
    currentSlice = 0;

    const first = seriesList[0]?.slices[0];
    if (first) {
      dicomMeta = {
        rows: first.rows, cols: first.cols,
        wl:   first.wc ?? 400,
        ww:   first.ww ?? 800,
        bpp:  first.bpp, sign: first.sign,
        rs:   first.rs, ri: first.ri,
        modality:       first.mod  || 'IRM',
        patientName:    first.pn   || 'Inconnu',
        studyDate:      first.sd   || '',
        sliceThickness: first.st   || '',
        total:          allSlices.length,
        seriesCount:    seriesList.length,
      };
    }

    setProgress(100, `${allSlices.length} images · ${seriesList.length} série${seriesList.length > 1 ? 's' : ''} ✓`);
    setTimeout(() => finishUpload(progress, done, toLoad, false), 400);
  }

  readBatch();
}

function finishUpload(progress, done, files, simulated) {
  const folderName = files[0]?.webkitRelativePath
    ? files[0].webkitRelativePath.split('/')[0]
    : (files[0]?.name || 'Dossier DICOM');

  const nSeries  = simulated ? 1 : dicomSeries.length;
  const total    = simulated ? files.length : (dicomMeta.total || 0);
  const modality = simulated ? (total > 100 ? 'CT' : 'IRM') : (dicomMeta.modality || 'IRM');

  const arc = document.getElementById('dicomProgressArc');
  arc.style.strokeDashoffset = 0;
  document.getElementById('dicomProgressPct').textContent   = '100%';
  document.getElementById('dicomProgressLabel').textContent = 'Chargement terminé ✓';

  setTimeout(() => {
    progress.style.display = 'none';
    // Afficher état "done" compact — la zone reste cliquable pour reimporter
    done.style.display = 'flex';
    document.getElementById('dicomDoneName').textContent = folderName;
    document.getElementById('dicomDoneMeta').textContent =
      `${total} im. · ${nSeries} série${nSeries>1?'s':''} · ${modality}`;

    // Construire le viewer, la liste de travail et le panneau patient
    if (!simulated && dicomSeries.length > 0) {
      buildViewerPanels();
      buildWorklist();
      updatePatientPanel();
      _panel3D.currentSeriesIdx = 0;
      _buildPanel3DSeqBtns();
      _applyMobileLayout();

      const labelText = `${dicomMeta.patientName || 'Patient'} · ${dicomMeta.modality || 'MR'} · ${total} images`;
      document.getElementById('toolLabelMain').textContent = labelText;
      document.getElementById('toolLabelMain').style.color = 'rgba(0,200,255,0.7)';

      // ── Cadre patient autour des 4 cases ──────────────────────
      const va = document.getElementById('viewerArea');
      va.classList.add('patient-loaded');

      // Barre patient en haut du viewer
      document.getElementById('viewerPatientBar')?.remove();
      const bar = document.createElement('div');
      bar.className = 'viewer-patient-bar';
      bar.id = 'viewerPatientBar';
      bar.innerHTML = `
        <div class="viewer-patient-dot"></div>
        <div class="viewer-patient-name">${dicomMeta.patientName || 'Patient'}</div>
        <div class="viewer-patient-meta">${dicomMeta.modality || 'MR'} · ${dicomMeta.seriesCount || dicomSeries.length} séries · ${total} images · ${formatDicomDate(dicomMeta.studyDate) || '—'}</div>
      `;
      va.appendChild(bar);
    }
  }, 600);
}

/* ════════════════════════════════════════════════════════════════
   VIEWER — rendu DICOM sur canvas 2D
   ════════════════════════════════════════════════════════════════ */

// Etat par panneau : { seriesIdx, sliceIdx, canvas, ctx, wl, ww }
const panels = [];
let activePanelIdx = 0;

/* Applique le fenêtrage et écrit les pixels sur le canvas */
function renderSliceOnCanvas(canvas, sliceInfo, wl, ww) {
  if (!sliceInfo || !sliceInfo.buf) return;

  const { rows, cols, bpp, sign, rs, ri, pixOffset, pixLength } = sliceInfo;
  if (!rows || !cols || pixOffset === null) return;

  canvas.width  = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');

  const buf      = sliceInfo.buf;
  const totalPx  = rows * cols;
  const imgData  = ctx.createImageData(cols, rows);
  const outPx    = imgData.data;

  const bytes  = bpp <= 8 ? 1 : 2;
  // DataView sur le buffer COMPLET — pixOffset est un offset absolu
  const dv     = new DataView(buf);
  const half   = ww / 2;
  const lo     = wl - half;
  const hi     = wl + half;
  const range  = hi - lo;

  for (let i = 0; i < totalPx; i++) {
    let raw = 0;
    const bytePos = pixOffset + i * bytes;
    try {
      raw = bytes === 1
        ? dv.getUint8(bytePos)
        : (sign ? dv.getInt16(bytePos, true) : dv.getUint16(bytePos, true));
    } catch (e) { /* hors limites → 0 */ }

    const hu  = raw * rs + ri;
    let   val = ((hu - lo) / range) * 255;
    val = val < 0 ? 0 : val > 255 ? 255 : val;
    const v   = val | 0;
    const o   = i * 4;
    outPx[o]   = v;
    outPx[o+1] = v;
    outPx[o+2] = v;
    outPx[o+3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}

/* Dessine une miniature 44×44 dans un canvas thumb */
function renderThumb(thumbCanvas, sliceInfo, wl, ww) {
  if (!sliceInfo || !sliceInfo.buf) return;
  // Créer un canvas temporaire pleine résolution
  const tmp = document.createElement('canvas');
  renderSliceOnCanvas(tmp, sliceInfo, wl, ww);
  if (!tmp.width || !tmp.height) return;
  // Redimensionner dans le canvas 44×44
  thumbCanvas.width  = 44;
  thumbCanvas.height = 44;
  const ctx = thumbCanvas.getContext('2d');
  ctx.drawImage(tmp, 0, 0, 44, 44);
}

/* Construit les 4 panneaux viewer après chargement */
function buildViewerPanels() {
  const viewerArea = document.getElementById('viewerArea');
  const ov = document.getElementById('aiOverlay');
  viewerArea.innerHTML = '';
  if (ov) viewerArea.appendChild(ov);
  panels.length = 0;

  // ── Affecter une série par case dans l'ordre FLAIR · T1W · T1WCE · T2W ──
  const SLOT_KEYWORDS = ['FLAIR', 'T1WCE', 'T1W', 'T2W'];

  // Fenêtrages optimaux par type IRM
  const WINDOWING = {
    'FLAIR':  { wl: 600,  ww: 2800 },
    'T1W':    { wl: 500,  ww: 2000 },
    'T1WCE':  { wl: 500,  ww: 2000 },
    'T2W':    { wl: 800,  ww: 3000 },
    'DWI':    { wl: 500,  ww: 1000 },
    'ADC':    { wl: 800,  ww: 1600 },
  };
  function windowingFor(desc) {
    const d = (desc || '').toUpperCase();
    // T1WCE avant T1W pour éviter faux match
    for (const key of ['FLAIR','T1WCE','T1W','T2W','DWI','ADC']) {
      if (d.includes(key)) return WINDOWING[key];
    }
    return { wl: dicomMeta.wl ?? 400, ww: dicomMeta.ww ?? 800 };
  }

  // Associer chaque slot à la série la plus pertinente
  const assigned = new Set();
  const panelSeries = SLOT_KEYWORDS.map(keyword => {
    let found = dicomSeries.find(s =>
      !assigned.has(s.uid) &&
      s.desc.toUpperCase().includes(keyword)
    );
    if (!found) found = dicomSeries.find(s => !assigned.has(s.uid));
    // Pas de fallback sur dicomSeries[0] — si plus de série dispo, on retourne null
    if (found) assigned.add(found.uid);
    return found;
  }).filter(Boolean); // supprimer les slots null/vides

  // Ajuster la grille CSS selon le nombre de panneaux réels
  const n = panelSeries.length;
  if      (n === 1) viewerArea.style.gridTemplateColumns = '1fr';
  else if (n === 2) viewerArea.style.gridTemplateColumns = '1fr 1fr';
  else if (n === 3) viewerArea.style.gridTemplateColumns = '1fr 1fr 1fr';
  else              viewerArea.style.gridTemplateColumns = '1fr 1fr';
  viewerArea.style.gridTemplateRows = n <= 2 ? '1fr' : '1fr 1fr';

  // ── Construire les panneaux DOM (un par série réelle) ──
  for (let p = 0; p < panelSeries.length; p++) {
    const series   = panelSeries[p];
    const win      = windowingFor(series?.desc);
    const sliceIdx = Math.floor((series?.slices?.length || 1) / 2);

    const panel = document.createElement('div');
    panel.className = 'scan-panel mp-panel';
    panel.dataset.panelIdx = p;

    // Info coupe haut-gauche (matrice, numéro)
    const info = document.createElement('div');
    info.className = 'scan-panel-info';
    info.id = `panelInfo${p}`;

    // Badge série bas-droite — gras, grand, coloré
    const badge = document.createElement('div');
    badge.className = 'panel-series-badge';
    badge.id = `seriesBadge${p}`;
    const desc  = series?.desc || `Série ${p+1}`;
    badge.textContent = desc;
    badge.style.color = seriesAccentColor(desc);

    // Bouton lecture plein panneau
    const expandBtn = document.createElement('button');
    expandBtn.className = 'panel-expand-btn';
    expandBtn.title = 'Mode lecture';
    expandBtn.innerHTML = '⛶';
    expandBtn.addEventListener('click', e => {
      e.stopPropagation();
      enterReadMode(p);
    });

    // Bouton vue 3D
    const btn3d = document.createElement('button');
    btn3d.className = 'panel-3d-btn';
    btn3d.title = 'Visualisation 3D';
    btn3d.innerHTML = '◈ 3D';
    btn3d.addEventListener('click', e => {
      e.stopPropagation();
      open3DView(p);
    });

    const wrap = document.createElement('div');
    wrap.className = 'mp-canvas-wrap';

    const mainCanvas = document.createElement('canvas');
    mainCanvas.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;cursor:crosshair;image-rendering:pixelated;';
    wrap.appendChild(mainCanvas);

    const filmstrip = document.createElement('div');
    filmstrip.className = 'mp-filmstrip';
    filmstrip.id = `filmstrip${p}`;

    panel.appendChild(info);
    panel.appendChild(badge);
    panel.appendChild(expandBtn);
    panel.appendChild(btn3d);
    panel.appendChild(wrap);
    panel.appendChild(filmstrip);
    viewerArea.appendChild(panel);

    panel.addEventListener('click', () => setActivePanel(p));

    if (series?.slices?.length) {
      panels.push({ sliceIdx, canvas: mainCanvas, wl: win.wl, ww: win.ww, series });
      renderPanelSlice(p, sliceIdx);
      buildFilmstrip(p);
    } else {
      panels.push({ sliceIdx, canvas: mainCanvas, wl: win.wl, ww: win.ww, series });
    }
  }

  // Construire les barres WL après que tous les panels[] sont poussés
  for (let p = 0; p < panelSeries.length; p++) {
    buildPanelWlBar(p);
  }

  setActivePanel(0);

  // Attacher les événements souris maintenant que les panneaux existent
  if (typeof attachAllPanelEvents === 'function') attachAllPanelEvents();
}

function setActivePanel(idx) {
  activePanelIdx = idx;
  document.querySelectorAll('.scan-panel').forEach((el, i) => {
    el.style.outline = i === idx ? '2px solid rgba(0,200,255,0.6)' : 'none';
  });
  updateSliceInfo();
}

function renderPanelSlice(panelIdx, sliceIdx) {
  const ps     = panels[panelIdx];
  if (!ps) return;
  const slices = ps.series?.slices;
  if (!slices?.length) return;

  const si = Math.max(0, Math.min(sliceIdx, slices.length - 1));
  ps.sliceIdx = si;
  const slice = slices[si];

  renderSliceOnCanvas(ps.canvas, slice, ps.wl, ps.ww);

  // Mettre à jour l'info
  const infoEl = document.getElementById(`panelInfo${panelIdx}`);
  if (infoEl) {
    infoEl.textContent = `${slice.rows}×${slice.cols}  Im ${si+1}/${slices.length}${slice.st ? '  Ép '+slice.st+'mm' : ''}`;
  }

  // Highlight miniature active
  const fs = document.getElementById(`filmstrip${panelIdx}`);
  if (fs) {
    fs.querySelectorAll('.mp-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === si);
      if (i === si) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
  }
}

function buildFilmstrip(panelIdx) {
  const ps     = panels[panelIdx];
  const fs     = document.getElementById(`filmstrip${panelIdx}`);
  if (!ps || !fs) return;
  const slices = ps.series?.slices || [];

  fs.innerHTML = '';
  // Construire les thumbs en lazy (par batch pour ne pas bloquer l'UI)
  const BATCH = 20;
  let i = 0;
  function nextBatch() {
    const end = Math.min(i + BATCH, slices.length);
    for (; i < end; i++) {
      const si = i; // capture
      const wrap = document.createElement('div');
      wrap.className = 'mp-thumb' + (si === ps.sliceIdx ? ' active' : '');

      const tc = document.createElement('canvas');
      tc.width = 44; tc.height = 44;
      renderThumb(tc, slices[si], ps.wl, ps.ww);

      const num = document.createElement('div');
      num.className = 'mp-thumb-num';
      num.textContent = si + 1;

      wrap.appendChild(tc);
      wrap.appendChild(num);
      wrap.addEventListener('click', e => {
        e.stopPropagation();
        renderPanelSlice(panelIdx, si);
      });
      fs.appendChild(wrap);
    }
    if (i < slices.length) setTimeout(nextBatch, 0);
  }
  nextBatch();
}

/* ── WINDOWING ── */
function updateWindowing() {
  // Applique au panneau actif uniquement (outil ☀)
  const ps = panels[activePanelIdx];
  if (!ps) return;
  syncPanelWlBar(activePanelIdx);
  renderPanelWithTransform(activePanelIdx);
  if (typeof updateSliceInfo === 'function') updateSliceInfo();
}

function buildPanelWlBar(panelIdx) {
  const ps    = panels[panelIdx];
  const panel = document.querySelector(`.scan-panel[data-panel-idx="${panelIdx}"]`);
  if (!ps || !panel) return;

  // Supprimer l'ancienne barre si elle existe
  panel.querySelector('.panel-wl-bar')?.remove();

  const desc  = ps.series?.desc || '';
  const seq   = getSeqKey(desc);   // 'FLAIR' | 'T1W' | 'T1WCE' | 'T2W' | ...
  const color = seriesAccentColor(seq || desc);

  // Paramètres WL/WW selon la séquence avec explication clinique
  const seqInfo = WL_PARAMS[seq] || WL_PARAMS['DEFAULT'];

  const bar = document.createElement('div');
  bar.className = 'panel-wl-bar';
  bar.dataset.panelIdx = panelIdx;
  if (seq) bar.dataset.seq = seq;

  bar.innerHTML = `
    <div class="panel-wl-title">
      <span style="color:${color}">${desc || `Série ${panelIdx+1}`}</span>
      <span class="panel-wl-seqinfo">${seqInfo.label}</span>
      <button class="panel-wl-reset" onclick="resetWindowing(${panelIdx})">↺</button>
    </div>
    <div class="panel-wl-row">
      <span class="panel-wl-label">WL</span>
      <input class="panel-wl-slider" type="range"
        id="pwl-${panelIdx}"
        min="${seqInfo.wlMin}" max="${seqInfo.wlMax}"
        value="${Math.round(ps.wl)}"
        oninput="onPanelWl(${panelIdx},this)">
      <span class="panel-wl-val" id="pwlv-${panelIdx}">${Math.round(ps.wl)}</span>
    </div>
    <div class="panel-wl-row">
      <span class="panel-wl-label">WW</span>
      <input class="panel-wl-slider" type="range"
        id="pww-${panelIdx}"
        min="${seqInfo.wwMin}" max="${seqInfo.wwMax}"
        value="${Math.round(ps.ww)}"
        oninput="onPanelWw(${panelIdx},this)">
      <span class="panel-wl-val" id="pwwv-${panelIdx}">${Math.round(ps.ww)}</span>
    </div>`;

  // Insérer entre canvas-wrap et filmstrip (dans le flux flex)
  const filmstrip = panel.querySelector('.mp-filmstrip');
  if (filmstrip) panel.insertBefore(bar, filmstrip);
  else panel.appendChild(bar);
}

// Clé de séquence normalisée
function getSeqKey(desc) {
  const d = (desc || '').toUpperCase();
  if (d.includes('FLAIR'))                                         return 'FLAIR';
  if (d.includes('T1WCE') || d.includes('T1W+C') || d.includes('T1+C') || (d.includes('T1') && d.includes('CE'))) return 'T1WCE';
  if (d.includes('T1'))                                            return 'T1W';
  if (d.includes('T2'))                                            return 'T2W';
  if (d.includes('DWI'))                                           return 'DWI';
  if (d.includes('ADC'))                                           return 'ADC';
  return null;
}

// Paramètres WL/WW optimaux par séquence IRM cérébrale
// WL = Window Level (centre) · WW = Window Width (largeur)
const WL_PARAMS = {
  'FLAIR': {
    wl: 600,  ww: 2800,
    wlMin: 200,  wlMax: 1200,
    wwMin: 800,  wwMax: 4000,
    label: 'Lésions SB · Œdème',
  },
  'T1W': {
    wl: 500,  ww: 2000,
    wlMin: 100,  wlMax: 900,
    wwMin: 400,  wwMax: 3500,
    label: 'Anatomie · SG/SB',
  },
  'T1WCE': {
    wl: 520,  ww: 1800,
    wlMin: 100,  wlMax: 900,
    wwMin: 400,  wwMax: 3500,
    label: 'Rehaussement gadolinium',
  },
  'T2W': {
    wl: 800,  ww: 3000,
    wlMin: 300,  wlMax: 1500,
    wwMin: 800,  wwMax: 5000,
    label: 'LCR · Lésions · Œdème',
  },
  'DWI': {
    wl: 500,  ww: 1000,
    wlMin: 100,  wlMax: 900,
    wwMin: 200,  wwMax: 2000,
    label: 'Diffusion · Ischémie aiguë',
  },
  'ADC': {
    wl: 800,  ww: 1600,
    wlMin: 200,  wlMax: 1400,
    wwMin: 400,  wwMax: 3000,
    label: 'Coefficient diffusion',
  },
  'DEFAULT': {
    wl: 400,  ww: 800,
    wlMin: -500, wlMax: 2000,
    wwMin: 100,  wwMax: 4000,
    label: '',
  },
};


function onPanelWl(panelIdx, input) {
  const ps = panels[panelIdx];
  if (!ps) return;
  ps.wl = parseFloat(input.value);
  const v = document.getElementById(`pwlv-${panelIdx}`);
  if (v) v.textContent = Math.round(ps.wl);
  renderPanelWithTransform(panelIdx);
  if (panelIdx === activePanelIdx && typeof updateSliceInfo === 'function') updateSliceInfo();
}

function onPanelWw(panelIdx, input) {
  const ps = panels[panelIdx];
  if (!ps) return;
  ps.ww = parseFloat(input.value);
  const v = document.getElementById(`pwwv-${panelIdx}`);
  if (v) v.textContent = Math.round(ps.ww);
  renderPanelWithTransform(panelIdx);
  if (panelIdx === activePanelIdx && typeof updateSliceInfo === 'function') updateSliceInfo();
}

function syncPanelWlBar(panelIdx) {
  const ps = panels[panelIdx];
  if (!ps) return;
  const els = ['pwl','pww','pwlv','pwwv'].map(id => document.getElementById(`${id}-${panelIdx}`));
  if (els[0]) els[0].value = Math.round(ps.wl);
  if (els[1]) els[1].value = Math.round(ps.ww);
  if (els[2]) els[2].textContent = Math.round(ps.wl);
  if (els[3]) els[3].textContent = Math.round(ps.ww);
}

function getDefaultWindowing(desc) {
  const key = getSeqKey(desc);
  const p   = WL_PARAMS[key] || WL_PARAMS['DEFAULT'];
  return { wl: p.wl, ww: p.ww };
}

function resetWindowing(panelIdx) {
  const ps = panels[panelIdx];
  if (!ps) return;
  const def = getDefaultWindowing(ps.series?.desc);
  ps.wl = def.wl;
  ps.ww = def.ww;
  // Reconstruire la barre pour mettre à jour les min/max si la série a changé
  buildPanelWlBar(panelIdx);
  syncPanelWlBar(panelIdx);
  renderPanelWithTransform(panelIdx);
  if (panelIdx === activePanelIdx && typeof updateSliceInfo === 'function') updateSliceInfo();
}

/* ── WORKLIST ── */
function seriesAccentColor(desc) {
  const d = (desc || '').toUpperCase();
  if (d.includes('FLAIR'))                                    return 'rgba(0,220,255,1)';
  if (d.includes('T1WCE') || d.includes('T1W+C') || d.includes('T1+C')) return 'rgba(168,85,247,1)';
  if (d.includes('T1'))                                       return 'rgba(255,180,50,1)';
  if (d.includes('T2'))                                       return 'rgba(0,255,157,1)';
  if (d.includes('DWI'))                                      return 'rgba(255,100,100,1)';
  if (d.includes('ADC'))                                      return 'rgba(255,160,60,1)';
  return 'rgba(0,200,255,0.8)';
}

function buildWorklist() {
  const wl = document.getElementById('worklist');
  wl.innerHTML = '';

  if (!dicomSeries.length) {
    // Pas de DICOM chargé — afficher seulement les patients fictifs
    return;
  }

  // ── Carte patient DICOM ──────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'wl-patient-card selected';
  card.id = 'wlPatientCard';

  const patName = dicomMeta.patientName || 'Patient Anonyme';
  const patId   = dicomMeta.patientId   || '—';
  const patDate = formatDicomDate(dicomMeta.studyDate) || '—';
  const patMod  = dicomMeta.modality    || 'MR';
  const nImg    = dicomMeta.total       || dicomSlices.length;

  card.innerHTML = `
    <div class="wl-card-header">
      <div>
        <div class="wl-card-name">${patName}</div>
        <div class="wl-card-sub">
          ID : ${patId}<br>
          ${patDate} · ${patMod} · ${nImg} images
        </div>
      </div>
      <div class="wl-card-badge-new">NOUVEAU</div>
    </div>
    <div class="wl-series-grid" id="wlSeriesGrid"></div>`;

  wl.appendChild(card);

  // ── Grille 2×2 des séries ──────────────────────────────────────
  const SLOTS = ['FLAIR', 'T1W', 'T1WCE', 'T2W'];
  const grid  = card.querySelector('#wlSeriesGrid');

  const slotSeries = SLOTS.map(key => {
    return dicomSeries.find(s => {
      const d = (s.desc || '').toUpperCase();
      if (key === 'FLAIR')  return d.includes('FLAIR');
      if (key === 'T1WCE')  return d.includes('T1WCE') || d.includes('T1W+C') || d.includes('T1+C') || (d.includes('T1') && d.includes('CE'));
      if (key === 'T1W')    return d.includes('T1') && !d.includes('CE') && !d.includes('WCE');
      if (key === 'T2W')    return d.includes('T2');
      return false;
    }) || dicomSeries[SLOTS.indexOf(key)] || null;
  });

  SLOTS.forEach((key, slotIdx) => {
    const series = slotSeries[slotIdx];
    const cell   = document.createElement('div');
    cell.className = 'wl-series-cell';
    cell.dataset.slotIdx = slotIdx;

    const color = seriesAccentColor(key);

    if (series) {
      const rep = series.slices?.[0] || {};
      const sub = [
        rep.rows && rep.cols ? `${rep.rows}×${rep.cols}` : '',
        rep.st ? `${rep.st}mm` : ''
      ].filter(Boolean).join(' · ');

      cell.innerHTML = `
        <div class="wl-series-cell-slot">S${slotIdx+1}</div>
        <div class="wl-series-cell-label" style="color:${color}">${series.desc}</div>
        <div class="wl-series-cell-count">${series.slices.length} images</div>
        ${sub ? `<div class="wl-series-cell-sub">${sub}</div>` : ''}`;

      cell.title = `Charger ${series.desc} dans le panneau actif`;
      cell.addEventListener('click', () => {
        grid.querySelectorAll('.wl-series-cell').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
        const ps = panels[activePanelIdx];
        if (ps) {
          ps.series   = series;
          ps.sliceIdx = Math.floor(series.slices.length / 2);
          renderPanelSlice(activePanelIdx, ps.sliceIdx);
          buildFilmstrip(activePanelIdx);
          const b = document.getElementById(`seriesBadge${activePanelIdx}`);
          if (b) { b.textContent = series.desc; b.style.color = seriesAccentColor(series.desc); }
          if (typeof buildPanelWlBar === 'function') buildPanelWlBar(activePanelIdx);
          if (typeof updateSliceInfo === 'function') updateSliceInfo();
        }
      });
    } else {
      cell.innerHTML = `
        <div class="wl-series-cell-slot">S${slotIdx+1}</div>
        <div class="wl-series-cell-label" style="color:rgba(255,255,255,0.1)">${key}</div>
        <div class="wl-series-cell-count" style="color:rgba(255,255,255,0.12)">—</div>`;
      cell.style.opacity = '0.45';
      cell.style.cursor  = 'default';
    }

    grid.appendChild(cell);
  });

  _syncWlActiveCells();

  // ── Séparateur puis patients fictifs ──────────────────────────
}


function showWlToast(msg) {
  let t = document.getElementById('wlToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'wlToast';
    t.className = 'wl-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visible'), 2600);
}


// Met à jour le surlignage actif dans la grille worklist
function _syncWlActiveCells() {
  const grid = document.getElementById('wlSeriesGrid');
  if (!grid) return;
  const activeSeries = panels[activePanelIdx]?.series;
  grid.querySelectorAll('.wl-series-cell').forEach(cell => {
    const slotIdx = parseInt(cell.dataset.slotIdx);
    const SLOTS = ['FLAIR', 'T1W', 'T1WCE', 'T2W'];
    const s = dicomSeries.find(s => {
      const d = (s.desc || '').toUpperCase();
      const key = SLOTS[slotIdx];
      if (key === 'FLAIR')  return d.includes('FLAIR');
      if (key === 'T1WCE')  return d.includes('T1WCE') || d.includes('T1W+C') || d.includes('T1+C');
      if (key === 'T1W')    return d.includes('T1') && !d.includes('CE');
      if (key === 'T2W')    return d.includes('T2');
      return false;
    }) || dicomSeries[slotIdx];
    cell.classList.toggle('active', !!(activeSeries && s && activeSeries.uid === s.uid));
  });
}


/* ── PATIENT PANEL ── */
function updatePatientPanel() {
  // Patient tab removed — just update slice info in sidebar
  updateSliceInfo();
}

function updateSliceInfo() {
  const block   = document.getElementById('sideSliceBlock');
  const details = document.getElementById('sideSliceDetails');
  if (!block || !details) return;

  const ps = panels[activePanelIdx];
  if (!ps?.series?.slices?.length) { block.style.display = 'none'; return; }

  const slice = ps.series.slices[Math.max(0, Math.min(ps.sliceIdx, ps.series.slices.length-1))];
  if (!slice) { block.style.display = 'none'; return; }

  block.style.display = 'block';

  // Badge nom de série
  const badge = document.getElementById('sideSliceSeries');
  if (badge) badge.textContent = ps.series.desc || '';

  // Helper
  const fmt  = (v, unit='', dec=1) => v != null ? `${typeof dec==='number' ? (+v).toFixed(dec) : v}${unit}` : '—';
  const fmtN = (v, unit='') => v != null && v !== 0 ? fmt(v, unit) : '—';

  // Calculer le FOV depuis pixelSpacing × matrice
  const fovH = slice.pixelSpacing && slice.rows ? (slice.pixelSpacing * slice.rows).toFixed(0) : null;
  const fovW = slice.pixelSpacing && slice.cols ? (slice.pixelSpacing * slice.cols).toFixed(0) : null;
  const fov  = fovH && fovW ? `${fovH}×${fovW} mm` : '—';

  const rows = [
    ['Coupe',       `${ps.sliceIdx + 1} / ${ps.series.slices.length}`],
    ['Matrice',     slice.rows && slice.cols ? `${slice.rows}×${slice.cols}` : '—'],
    ['Épaisseur',   fmtN(slice.st, ' mm')],
    ['Pixel',       slice.pixelSpacing ? `${(+slice.pixelSpacing).toFixed(3)} mm` : '—'],
    ['FOV',         fov],
    ['WL / WW',     `${Math.round(ps.wl)} / ${Math.round(ps.ww)}`],
    ['TR',          slice.tr  != null ? `${Math.round(slice.tr)} ms`   : '—'],
    ['TE',          slice.te  != null ? `${(+slice.te).toFixed(1)} ms` : '—'],
    ['TI',          slice.ti  != null ? `${Math.round(slice.ti)} ms`   : '—'],
    ['Flip',        slice.fa  != null ? `${Math.round(slice.fa)}°`     : '—'],
    ['Champ',       slice.fieldStrength != null ? `${slice.fieldStrength} T` : '—'],
    ['Protocole',   slice.protocol || '—'],
    ['Position Z',  slice.sliceLoc != null ? `${(+slice.sliceLoc).toFixed(1)} mm` : '—'],
    ['Instance',    slice.inst || '—'],
  ].filter(([, v]) => v !== '—');  // masquer les lignes vides

  details.innerHTML = rows.map(([k, v]) => `
    <div class="info-row">
      <span class="info-key">${k}</span>
      <span class="info-val">${v}</span>
    </div>`).join('');
}

function formatDicomDate(raw) {
  if (!raw || raw.length < 8) return raw || '—';
  return `${raw.slice(6,8)}/${raw.slice(4,6)}/${raw.slice(0,4)}`;
}

/* ── INIT DOM ── */
/* ════════════════════════════════════════════════════════════════
   MODE LECTURE
   ════════════════════════════════════════════════════════════════ */
let readModeActive = false;
let readPanelIdx   = -1;
let readNavBar     = null;

function enterReadMode(panelIdx) {
  if (readModeActive) exitReadMode();
  readModeActive = true;
  readPanelIdx   = panelIdx;

  const viewerArea = document.getElementById('viewerArea');
  viewerArea.classList.add('read-mode');

  // Marquer le panneau actif
  document.querySelectorAll('.scan-panel').forEach((el, i) => {
    el.classList.toggle('read-active', i === panelIdx);
  });

  const ps     = panels[panelIdx];
  const slices = ps?.series?.slices || [];
  initPanelExtras(ps);

  // Créer la barre de navigation
  readNavBar = document.createElement('div');
  readNavBar.className = 'read-nav-bar';
  readNavBar.id = 'readNavBar';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'read-nav-btn';
  prevBtn.innerHTML = '‹';
  prevBtn.title = 'Coupe précédente';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'read-nav-btn';
  nextBtn.innerHTML = '›';
  nextBtn.title = 'Coupe suivante';

  const firstBtn = document.createElement('button');
  firstBtn.className = 'read-nav-btn';
  firstBtn.innerHTML = '«';
  firstBtn.title = 'Première coupe';

  const lastBtn = document.createElement('button');
  lastBtn.className = 'read-nav-btn';
  lastBtn.innerHTML = '»';
  lastBtn.title = 'Dernière coupe';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'read-slider';
  slider.min   = 0;
  slider.max   = slices.length - 1;
  slider.value = ps.sliceIdx;

  const sliceInfo = document.createElement('div');
  sliceInfo.className = 'read-slice-info';
  sliceInfo.id = 'readSliceInfo';
  sliceInfo.textContent = `${ps.sliceIdx + 1} / ${slices.length}`;

  const seriesName = document.createElement('div');
  seriesName.className = 'read-series-name';
  seriesName.textContent = ps.series?.desc || `Série ${panelIdx+1}`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'read-close-btn';
  closeBtn.innerHTML = '✕';
  closeBtn.title = 'Quitter le mode lecture';

  // Actions
  function goTo(idx) {
    renderPanelSlice(panelIdx, idx);
    slider.value = panels[panelIdx].sliceIdx;
    sliceInfo.textContent = `${panels[panelIdx].sliceIdx + 1} / ${slices.length}`;
  }

  prevBtn.addEventListener('click',  () => goTo(panels[panelIdx].sliceIdx - 1));
  nextBtn.addEventListener('click',  () => goTo(panels[panelIdx].sliceIdx + 1));
  firstBtn.addEventListener('click', () => goTo(0));
  lastBtn.addEventListener('click',  () => goTo(slices.length - 1));
  slider.addEventListener('input',   () => goTo(parseInt(slider.value)));
  closeBtn.addEventListener('click', () => exitReadMode());

  readNavBar.append(firstBtn, prevBtn, sliceInfo, slider, nextBtn, lastBtn, seriesName, closeBtn);

  // Compteur flottant
  const counter = document.createElement('div');
  counter.className = 'read-overlay-counter';
  counter.id = 'readCounter';
  counter.textContent = `${ps.sliceIdx + 1} / ${slices.length}`;

  document.querySelector('.scan-panel.read-active').appendChild(readNavBar);
  document.querySelector('.scan-panel.read-active').appendChild(counter);

  // Raccourcis clavier
  document._readKeyHandler = e => {
    if (!readModeActive) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      goTo(panels[panelIdx].sliceIdx + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      goTo(panels[panelIdx].sliceIdx - 1);
    } else if (e.key === 'Home')   { goTo(0); }
    else if  (e.key === 'End')     { goTo(slices.length - 1); }
    else if  (e.key === 'Escape')  { exitReadMode(); }
    // Mise à jour du compteur flottant
    const c = document.getElementById('readCounter');
    if (c) c.textContent = `${panels[panelIdx].sliceIdx + 1} / ${slices.length}`;
  };
  document.addEventListener('keydown', document._readKeyHandler);

  // Molette en mode lecture
  document._readWheelHandler = e => {
    if (!readModeActive) return;
    e.preventDefault();
    goTo(panels[panelIdx].sliceIdx + (e.deltaY > 0 ? 1 : -1));
    const c = document.getElementById('readCounter');
    if (c) c.textContent = `${panels[panelIdx].sliceIdx + 1} / ${slices.length}`;
  };
  const readPanel = document.querySelector('.scan-panel.read-active');
  readPanel.addEventListener('wheel', document._readWheelHandler, { passive: false });

  // Resize pour le canvas
  setTimeout(() => renderPanelWithTransform(panelIdx), 50);

  setActivePanel(panelIdx);
}

function exitReadMode() {
  if (!readModeActive) return;
  readModeActive = false;

  const viewerArea = document.getElementById('viewerArea');
  viewerArea.classList.remove('read-mode');

  document.querySelectorAll('.scan-panel').forEach(el => el.classList.remove('read-active'));

  document.getElementById('readNavBar')?.remove();
  document.getElementById('readCounter')?.remove();

  if (document._readKeyHandler) {
    document.removeEventListener('keydown', document._readKeyHandler);
    document._readKeyHandler = null;
  }

  panels.forEach((_, i) => renderPanelWithTransform(i));
}

/* ════════════════════════════════════════════════════════════════
   VISUALISATION 3D — Volume Rendering (MIP raycasting, Three.js)
   ════════════════════════════════════════════════════════════════ */

let current3DRenderer = null;

function open3DView(panelIdx) {
  const ps = panels[panelIdx];
  if (!ps?.series?.slices?.length) return;

  // Supprimer une vue 3D existante
  close3DView();

  const overlay = document.createElement('div');
  overlay.id = 'view3DOverlay';
  overlay.className = 'view3d-overlay';

  const desc  = ps.series.desc || `Série ${panelIdx + 1}`;
  const color = seriesAccentColor(desc);
  const seqKey = getSeqKey(desc) || 'DEFAULT';

  overlay.innerHTML = `
    <div class="view3d-header">
      <div class="view3d-title">
        <span style="color:${color}">◈ 3D</span>
        &nbsp;·&nbsp;
        <span>${desc}</span>
        <span class="view3d-sub" id="v3dStatus">Préparation du volume…</span>
      </div>
      <div class="view3d-controls">
        <span class="view3d-hint">🖱 Orbite · Scroll: zoom · Shift+drag: déplacer</span>
        <div class="view3d-mode-btns">
          <button class="v3d-btn active" id="v3dMIP"   onclick="set3DMode('MIP')">MIP</button>
          <button class="v3d-btn"        id="v3dDVR"   onclick="set3DMode('DVR')">Volume</button>
          <button class="v3d-btn"        id="v3dSlabs" onclick="set3DMode('SLAB')">Coupes</button>
          <button class="v3d-btn v3d-spin-btn" id="v3dSpinBtn" onclick="toggle3DSpin()" title="Rotation automatique">⟳ Auto</button>
        </div>
        <button class="view3d-close" onclick="close3DView()">✕</button>
      </div>
    </div>
    <div class="view3d-canvas-wrap" id="view3dWrap"></div>
    <div class="view3d-footer">
      <div class="view3d-stat" id="v3dStat"></div>
      <label class="view3d-sl-label">Opacité
        <input type="range" min="1" max="100" value="60" class="view3d-slider" id="v3dOpacity"
          oninput="update3DParam('opacity', this.value)">
        <span id="v3dOpacityVal">60</span>%
      </label>
      <label class="view3d-sl-label">Éclairage
        <input type="range" min="0" max="100" value="50" class="view3d-slider" id="v3dLight"
          oninput="update3DParam('light', this.value)">
      </label>
      <label class="view3d-sl-label">Seuil bas
        <input type="range" min="0" max="255" value="20" class="view3d-slider" id="v3dThreshLo"
          oninput="update3DParam('threshLo', this.value)">
      </label>
      <label class="view3d-sl-label">Vitesse ⟳
        <input type="range" min="1" max="40" value="8" class="view3d-slider" id="v3dSpinSpeed"
          oninput="update3DParam('spinSpeed', this.value)">
      </label>
    </div>`;

  document.body.appendChild(overlay);

  // Construire le volume en différé pour laisser le DOM s'afficher
  setTimeout(() => build3DVolume(panelIdx, overlay, color, seqKey), 60);
}

function close3DView() {
  if (current3DRenderer) {
    current3DRenderer.dispose();
    current3DRenderer = null;
  }
  document.getElementById('view3DOverlay')?.remove();
}

let _3dState = {
  mode: 'MIP', opacity: 0.6, light: 0.5, threshLo: 20,
  uniforms: null, renderer: null, scene: null, camera: null,
  animId: null, isDragging: false, isShift: false,
  lastX: 0, lastY: 0, pivot: null, slabMeshes: [],
  autoSpin: false, spinSpeed: 0.008,
};

function set3DMode(mode) {
  _3dState.mode = mode;
  document.querySelectorAll('.v3d-btn').forEach(b => b.classList.remove('active'));
  const ids = { MIP: 'v3dMIP', DVR: 'v3dDVR', SLAB: 'v3dSlabs' };
  document.getElementById(ids[mode])?.classList.add('active');
  if (_3dState.uniforms) {
    _3dState.uniforms.uMode.value = mode === 'MIP' ? 0 : mode === 'DVR' ? 1 : 2;
  }
}

function update3DParam(param, val) {
  const v = parseFloat(val);
  if (param === 'opacity')   { _3dState.opacity  = v / 100; document.getElementById('v3dOpacityVal').textContent = Math.round(v); }
  if (param === 'light')     { _3dState.light     = v / 100; }
  if (param === 'threshLo')  { _3dState.threshLo  = v; }
  if (param === 'spinSpeed') { _3dState.spinSpeed  = v / 1000; }
  if (_3dState.uniforms) {
    if (param === 'opacity')  _3dState.uniforms.uAlpha.value     = _3dState.opacity;
    if (param === 'light')    _3dState.uniforms.uLight.value     = _3dState.light;
    if (param === 'threshLo') _3dState.uniforms.uThreshLo.value  = _3dState.threshLo / 255;
  }
}

function toggle3DSpin() {
  _3dState.autoSpin = !_3dState.autoSpin;
  const btn = document.getElementById('v3dSpinBtn');
  if (btn) {
    btn.classList.toggle('active', _3dState.autoSpin);
    btn.textContent = _3dState.autoSpin ? '⏸ Auto' : '⟳ Auto';
  }
}

async function build3DVolume(panelIdx, overlay, accentColor, seqKey) {
  const ps     = panels[panelIdx];
  const slices = ps.series.slices;
  const N      = slices.length;
  const wrap   = document.getElementById('view3dWrap');
  const statEl = document.getElementById('v3dStat');
  const statusEl = document.getElementById('v3dStatus');

  if (!wrap) return;

  // ── 1. Résolution du volume (limiter pour perf) ─────────────
  const MAX_DIM = 128;           // voxels max par axe
  const srcW  = slices[0].cols  || 256;
  const srcH  = slices[0].rows  || 256;
  const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH, N));
  const volW  = Math.round(srcW  * scale);
  const volH  = Math.round(srcH  * scale);
  const volD  = Math.min(N, MAX_DIM);
  const step  = Math.max(1, Math.floor(N / volD));

  statusEl.textContent = `Construction ${volW}×${volH}×${volD} voxels…`;

  // ── 2. Extraire les valeurs HU normalisées → Uint8Array 3D ──
  const data3D = new Uint8Array(volW * volH * volD);
  const wl = ps.wl, ww = ps.ww;
  const lo = wl - ww / 2, hi = wl + ww / 2, range = hi - lo;

  // Canvas temporaire pour rééchantillonner
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width  = volW;
  tmpCanvas.height = volH;
  const tmpCtx = tmpCanvas.getContext('2d');

  for (let z = 0; z < volD; z++) {
    const sliceIdx = Math.min(Math.round(z * step), N - 1);
    const slice    = slices[sliceIdx];

    // Rendre la coupe en pleine résolution
    const fullC = document.createElement('canvas');
    renderSliceOnCanvas(fullC, slice, wl, ww);

    // Réduire à la résolution du volume
    tmpCtx.drawImage(fullC, 0, 0, volW, volH);
    const imgData = tmpCtx.getImageData(0, 0, volW, volH).data;

    const zOff = z * volW * volH;
    for (let i = 0; i < volW * volH; i++) {
      data3D[zOff + i] = imgData[i * 4]; // canal R (niveaux de gris)
    }

    if (z % 16 === 0) {
      statusEl.textContent = `Voxels : ${Math.round((z / volD) * 100)}%`;
      await new Promise(r => setTimeout(r, 0)); // yield UI
    }
  }

  statusEl.textContent = `Rendu GPU…`;

  // ── 3. Créer la texture 3D Three.js ─────────────────────────
  const texture = new THREE.DataTexture3D(data3D, volW, volH, volD);
  texture.format = THREE.RedFormat;
  texture.type   = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  // ── 4. Shaders GLSL — raycasting MIP / DVR ──────────────────
  // Couleur d'accent selon séquence
  const seqColors = {
    FLAIR:  [0.0, 0.86, 1.0],
    T1W:    [1.0, 0.71, 0.2],
    T1WCE:  [0.66, 0.33, 0.97],
    T2W:    [0.0, 1.0, 0.62],
    DWI:    [1.0, 0.39, 0.39],
    DEFAULT:[0.0, 0.78, 1.0],
  };
  const [cr, cg, cb] = seqColors[seqKey] || seqColors.DEFAULT;

  const vertShader = `
    varying vec3 vOrigin;
    varying vec3 vDir;
    void main() {
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vOrigin = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz + 0.5;
      vDir    = position + 0.5 - vOrigin;
      gl_Position = projectionMatrix * mvPos;
    }`;

  const fragShader = `
    precision highp float;
    precision highp sampler3D;
    uniform sampler3D uVolume;
    uniform float uAlpha;
    uniform float uLight;
    uniform float uThreshLo;
    uniform int   uMode;         // 0=MIP 1=DVR 2=SLAB
    uniform vec3  uColor;
    uniform float uTime;
    varying vec3 vOrigin;
    varying vec3 vDir;

    // Intersection boîte unitaire [-0.5, 0.5]^3
    vec2 hitBox(vec3 orig, vec3 dir) {
      vec3 inv = 1.0 / dir;
      vec3 tMin = (-0.5 - orig) * inv;
      vec3 tMax = ( 0.5 - orig) * inv;
      vec3 t1 = min(tMin, tMax);
      vec3 t2 = max(tMin, tMax);
      return vec2(max(max(t1.x, t1.y), t1.z),
                  min(min(t2.x, t2.y), t2.z));
    }

    vec3 gradient(vec3 p) {
      float eps = 0.006;
      return normalize(vec3(
        texture(uVolume, p + vec3(eps,0,0)).r - texture(uVolume, p - vec3(eps,0,0)).r,
        texture(uVolume, p + vec3(0,eps,0)).r - texture(uVolume, p - vec3(0,eps,0)).r,
        texture(uVolume, p + vec3(0,0,eps)).r - texture(uVolume, p - vec3(0,0,eps)).r
      ));
    }

    void main() {
      vec3 rd = normalize(vDir);
      vec2 bounds = hitBox(vOrigin, rd);
      if (bounds.x >= bounds.y) { discard; return; }
      bounds.x = max(bounds.x, 0.0);

      float dt    = 0.004;
      float tMax  = bounds.y;
      float t     = bounds.x;

      float mip   = 0.0;
      vec4  accum = vec4(0.0);

      for (int i = 0; i < 400; i++) {
        if (t >= tMax || accum.a >= 0.98) break;
        vec3 pos = vOrigin + rd * t;
        float s  = texture(uVolume, pos + 0.5).r;

        if (uMode == 0) {
          // MIP
          mip = max(mip, s);
        } else if (uMode == 1) {
          // DVR — accumulation avec transfert de couleur
          if (s > uThreshLo) {
            float density = (s - uThreshLo) / (1.0 - uThreshLo);
            // Gradient pour l'éclairage
            vec3 N = gradient(pos + 0.5);
            float diff = max(dot(N, normalize(vec3(1.0, 1.0, 0.5))), 0.0);
            float amb  = 0.3;
            float light = amb + diff * uLight;
            vec3 col   = uColor * light;
            float a    = density * uAlpha * dt * 80.0;
            accum.rgb += (1.0 - accum.a) * col * a;
            accum.a   += (1.0 - accum.a) * a;
          }
        } else {
          // SLAB — coupes colorées empilées
          float zNorm = (pos.z + 0.5);
          float stripe = step(0.498, mod(zNorm * 12.0, 1.0));
          float sp = s * (1.0 - stripe * 0.3);
          if (sp > uThreshLo && accum.a < 0.5) {
            float a = sp * uAlpha * 0.4;
            vec3 col = uColor * sp;
            accum.rgb += (1.0 - accum.a) * col * a;
            accum.a   += (1.0 - accum.a) * a;
          }
        }
        t += dt;
      }

      if (uMode == 0) {
        // MIP final
        vec3 col = uColor * mip + vec3(mip * 0.15);
        float a  = mip > uThreshLo ? mip * uAlpha : 0.0;
        gl_FragColor = vec4(col * a, a);
      } else {
        gl_FragColor = accum;
      }

      if (gl_FragColor.a < 0.005) discard;
    }`;

  // ── 5. Scène Three.js ─────────────────────────────────────────
  const W = wrap.clientWidth  || 500;
  const H = wrap.clientHeight || 380;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x04080e, 1);
  wrap.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 10);
  camera.position.set(0, 0, 1.8);

  const aspect  = new THREE.Vector3(1, srcH / srcW, (volD * (slices[0]?.st || 1)) / srcW);
  const geo     = new THREE.BoxGeometry(aspect.x, aspect.y, aspect.z);

  const uniforms = {
    uVolume:   { value: texture },
    uAlpha:    { value: _3dState.opacity },
    uLight:    { value: _3dState.light },
    uThreshLo: { value: _3dState.threshLo / 255 },
    uMode:     { value: 0 },
    uColor:    { value: new THREE.Vector3(cr, cg, cb) },
    uTime:     { value: 0 },
  };
  _3dState.uniforms = uniforms;

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader:   vertShader,
    fragmentShader: fragShader,
    side: THREE.BackSide,
    transparent: true,
    depthTest: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Axes de référence discrets
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.6, -0.55, 0), new THREE.Vector3( 0.6, -0.55, 0),
    new THREE.Vector3(0, -0.55, -0.6), new THREE.Vector3(0, -0.55,  0.6),
  ]);
  const axisMat = new THREE.LineBasicMaterial({ color: 0x112233 });
  scene.add(new THREE.LineSegments(axisGeo, axisMat));

  // ── 6. Orbit controls maison ──────────────────────────────────
  const pivot  = new THREE.Object3D();
  scene.add(pivot);
  pivot.add(camera);

  let rotX = -0.3, rotY = 0.4, dist = 1.8;
  let panning = new THREE.Vector3();

  function applyOrbit() {
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;
    camera.position.z = dist;
    pivot.position.copy(panning);
  }
  applyOrbit();

  const canvasEl = renderer.domElement;

  canvasEl.addEventListener('mousedown', e => {
    _3dState.isDragging = true;
    _3dState.isShift    = e.shiftKey;
    _3dState.lastX = e.clientX;
    _3dState.lastY = e.clientY;
    e.preventDefault();
  });

  canvasEl.addEventListener('mousemove', e => {
    if (!_3dState.isDragging) return;
    const dx = (e.clientX - _3dState.lastX) * 0.008;
    const dy = (e.clientY - _3dState.lastY) * 0.008;
    _3dState.lastX = e.clientX;
    _3dState.lastY = e.clientY;
    if (e.shiftKey) {
      panning.x += dx * 0.4;
      panning.y -= dy * 0.4;
    } else {
      rotY += dx;
      rotX += dy;
      rotX  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    }
    applyOrbit();
  });

  window.addEventListener('mouseup', () => { _3dState.isDragging = false; });

  canvasEl.addEventListener('wheel', e => {
    dist = Math.max(0.6, Math.min(4.0, dist + e.deltaY * 0.002));
    applyOrbit();
    e.preventDefault();
  }, { passive: false });

  // Touch support
  let lastTouchDist = 0;
  canvasEl.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      _3dState.isDragging = true;
      _3dState.lastX = e.touches[0].clientX;
      _3dState.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
    e.preventDefault();
  }, { passive: false });

  canvasEl.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && _3dState.isDragging) {
      const dx = (e.touches[0].clientX - _3dState.lastX) * 0.008;
      const dy = (e.touches[0].clientY - _3dState.lastY) * 0.008;
      _3dState.lastX = e.touches[0].clientX;
      _3dState.lastY = e.touches[0].clientY;
      rotY += dx; rotX += dy;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      applyOrbit();
    } else if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      dist = Math.max(0.6, Math.min(4.0, dist - (d - lastTouchDist) * 0.005));
      lastTouchDist = d;
      applyOrbit();
    }
    e.preventDefault();
  }, { passive: false });

  canvasEl.addEventListener('touchend', () => { _3dState.isDragging = false; });

  // Resize
  const ro = new ResizeObserver(() => {
    const nw = wrap.clientWidth, nh = wrap.clientHeight;
    renderer.setSize(nw, nh);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
  ro.observe(wrap);

  // ── 7. Boucle de rendu ────────────────────────────────────────
  let frameN = 0;
  function animate() {
    _3dState.animId = requestAnimationFrame(animate);
    uniforms.uTime.value = frameN++ * 0.01;
    // Auto-spin
    if (_3dState.autoSpin && !_3dState.isDragging) {
      rotY += 0.008;
      applyOrbit();
    }
    renderer.render(scene, camera);
  }
  animate();

  // Nettoyer
  current3DRenderer = {
    dispose() {
      cancelAnimationFrame(_3dState.animId);
      ro.disconnect();
      texture.dispose();
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      _3dState.uniforms = null;
    }
  };

  // Stats
  statEl.textContent = `${volW}×${volH}×${volD} vox · ${N} coupes · ${desc}`;
  statusEl.textContent = '';

  // Reset les sliders sur les bons paramètres selon séquence
  const seqThresh = { FLAIR: 25, T1W: 15, T1WCE: 18, T2W: 20, DWI: 30, DEFAULT: 20 };
  const t0 = seqThresh[seqKey] || 20;
  const sl = document.getElementById('v3dThreshLo');
  if (sl) { sl.value = t0; _3dState.threshLo = t0; uniforms.uThreshLo.value = t0 / 255; }
}

function desc3DForPanel(p) {
  return panels[p]?.series?.desc || '';
}




let activeTool = 'select';

// État par panneau pour les transformations
// panelState étendu : zoom, panX, panY, rotation, inverted, annotations[]
function initPanelExtras(ps) {
  if (ps.zoom === undefined) {
    ps.zoom     = 1;
    ps.panX     = 0;
    ps.panY     = 0;
    ps.rotation = 0;
    ps.inverted = false;
    ps.annotations = []; // { type, pts, measurement }
  }
}

// ── Curseurs par outil ──────────────────────────────────────────
const TOOL_CURSORS = {
  select:  'default',
  zoom:    'zoom-in',
  pan:     'grab',
  wl:      'ew-resize',
  ruler:   'crosshair',
  angle:   'crosshair',
  roi:     'crosshair',
  rotate:  'default',
  invert:  'default',
};

const TOOL_NAMES = {
  select: 'Sélection',
  zoom:   'Zoom',
  pan:    'Déplacement',
  wl:     'Fenêtrage WL/WW',
  ruler:  'Mesure linéaire',
  angle:  'Mesure d\'angle',
  roi:    'ROI Rectangle',
  rotate: 'Rotation 90°',
  invert: 'Inverser',
};

// ── Rendu avec transformations ──────────────────────────────────
function renderPanelWithTransform(panelIdx) {
  const ps = panels[panelIdx];
  if (!ps) return;
  initPanelExtras(ps);
  const slices = ps.series?.slices;
  if (!slices?.length) return;

  const slice = slices[Math.max(0, Math.min(ps.sliceIdx, slices.length-1))];
  const wrap  = ps.canvas.parentElement;
  const displayW = wrap.clientWidth  || 512;
  const displayH = wrap.clientHeight || 512;

  // Canvas en coordonnées display
  ps.canvas.width  = displayW;
  ps.canvas.height = displayH;
  const ctx = ps.canvas.getContext('2d');
  ctx.clearRect(0, 0, displayW, displayH);

  // Rendu DICOM dans un canvas temporaire natif
  const tmp = document.createElement('canvas');
  renderSliceOnCanvas(tmp, slice, ps.wl, ps.ww);
  if (!tmp.width || !tmp.height) return;

  // Inversion
  if (ps.inverted) {
    const tc = tmp.getContext('2d');
    tc.globalCompositeOperation = 'difference';
    tc.fillStyle = 'white';
    tc.fillRect(0, 0, tmp.width, tmp.height);
  }

  // Appliquer transform : centrer + zoom + pan + rotation
  ctx.save();
  ctx.translate(displayW/2 + ps.panX, displayH/2 + ps.panY);
  ctx.rotate(ps.rotation * Math.PI / 180);
  ctx.scale(ps.zoom, ps.zoom);

  // Ajuster pour que l'image soit centrée
  const scale = Math.min(displayW / tmp.width, displayH / tmp.height);
  const drawW = tmp.width  * scale;
  const drawH = tmp.height * scale;
  ctx.drawImage(tmp, -drawW/2, -drawH/2, drawW, drawH);
  ctx.restore();

  // Stocker pour hit-testing (coordonnées image)
  ps._displayW = displayW;
  ps._displayH = displayH;
  ps._imgW = tmp.width;
  ps._imgH = tmp.height;
  ps._scale = scale;

  // Dessiner les annotations
  drawAnnotations(ctx, ps, displayW, displayH);
}

// ── Conversion coords display → image ──────────────────────────
function displayToImage(ps, dx, dy) {
  const cx = ps._displayW/2 + ps.panX;
  const cy = ps._displayH/2 + ps.panY;
  const rad = -ps.rotation * Math.PI / 180;
  const tx = (dx - cx);
  const ty = (dy - cy);
  const rx = tx * Math.cos(rad) - ty * Math.sin(rad);
  const ry = tx * Math.sin(rad) + ty * Math.cos(rad);
  const s  = ps._scale * ps.zoom;
  return {
    x: rx/s + ps._imgW/2,
    y: ry/s + ps._imgH/2
  };
}

// Pixels → mm (PixelSpacing approximatif, on utilise 1px = 0.5mm si inconnu)
function pxToMm(ps, px) {
  const spacing = ps.series?.slices[0]?.pixelSpacing || 0.5;
  return px * spacing;
}

// ── Dessin des annotations ──────────────────────────────────────
function drawAnnotations(ctx, ps, dw, dh) {
  for (const ann of ps.annotations) {
    if (ann.pts.length === 0) continue;
    const dpts = ann.pts.map(p => imageToDiplay(ps, p.x, p.y));

    ctx.strokeStyle = 'rgba(0,220,255,0.9)';
    ctx.fillStyle   = 'rgba(0,220,255,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.font        = '11px monospace';

    if (ann.type === 'ruler' && dpts.length >= 2) {
      const [a, b] = dpts;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      // Petits traits terminaux
      const ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
      for (const pt of [a, b]) {
        ctx.beginPath();
        ctx.moveTo(pt.x + Math.cos(ang)*5, pt.y + Math.sin(ang)*5);
        ctx.lineTo(pt.x - Math.cos(ang)*5, pt.y - Math.sin(ang)*5);
        ctx.stroke();
      }
      // Label
      const mid = { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
      const dx  = b.x - a.x, dy = b.y - a.y;
      const distPx = Math.sqrt(dx*dx + dy*dy) / (ps._scale * ps.zoom);
      const distMm = (distPx * 0.35).toFixed(1);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(mid.x+4, mid.y-13, 58, 15);
      ctx.fillStyle = 'rgba(0,220,255,1)';
      ctx.fillText(`${distMm} mm`, mid.x+6, mid.y-2);
      // Dots
      for (const pt of [a, b]) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2); ctx.fill();
      }

    } else if (ann.type === 'angle' && dpts.length >= 2) {
      const pts = dpts;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      if (pts.length === 3) {
        // Calculer l'angle
        const v1 = { x: pts[0].x-pts[1].x, y: pts[0].y-pts[1].y };
        const v2 = { x: pts[2].x-pts[1].x, y: pts[2].y-pts[1].y };
        const cos = (v1.x*v2.x + v1.y*v2.y) /
          (Math.sqrt(v1.x**2+v1.y**2) * Math.sqrt(v2.x**2+v2.y**2));
        const deg = (Math.acos(Math.max(-1,Math.min(1,cos))) * 180/Math.PI).toFixed(1);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(pts[1].x+4, pts[1].y-13, 44, 15);
        ctx.fillStyle = 'rgba(0,220,255,1)';
        ctx.fillText(`${deg}°`, pts[1].x+6, pts[1].y-2);
      }
      for (const pt of pts) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2); ctx.fill();
      }

    } else if (ann.type === 'roi' && dpts.length >= 2) {
      const [a, b] = [dpts[0], dpts[dpts.length-1]];
      const rx = Math.min(a.x,b.x), ry = Math.min(a.y,b.y);
      const rw = Math.abs(b.x-a.x), rh = Math.abs(b.y-a.y);
      ctx.strokeStyle = 'rgba(255,200,0,0.9)';
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = 'rgba(255,200,0,0.07)';
      ctx.fillRect(rx, ry, rw, rh);
      // Dimensions
      const wMm = (rw/(ps._scale*ps.zoom)*0.35).toFixed(1);
      const hMm = (rh/(ps._scale*ps.zoom)*0.35).toFixed(1);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(rx, ry-14, 90, 14);
      ctx.fillStyle = 'rgba(255,200,0,1)';
      ctx.font = '11px monospace';
      ctx.fillText(`${wMm}×${hMm} mm`, rx+3, ry-3);
    }
  }
}

function imageToDiplay(ps, ix, iy) {
  const s   = ps._scale * ps.zoom;
  const rad = ps.rotation * Math.PI / 180;
  const tx  = (ix - ps._imgW/2) * s;
  const ty  = (iy - ps._imgH/2) * s;
  const rx  = tx * Math.cos(rad) - ty * Math.sin(rad);
  const ry  = tx * Math.sin(rad) + ty * Math.cos(rad);
  return { x: rx + ps._displayW/2 + ps.panX, y: ry + ps._displayH/2 + ps.panY };
}

// ── État interaction souris ─────────────────────────────────────
let mouseState = {
  down: false,
  startX: 0, startY: 0,
  lastX: 0,  lastY: 0,
  panelIdx: -1,
  // Pour mesures multi-points
  pendingAnn: null,
};

function getCanvasPanelIdx(el) {
  let node = el;
  while (node) {
    if (node.dataset?.panelIdx !== undefined) return parseInt(node.dataset.panelIdx);
    node = node.parentElement;
  }
  return activePanelIdx;
}

function attachPanelEvents(wrap, panelIdx) {
  const canvas = wrap.querySelector('canvas');
  if (!canvas) return;

  canvas.addEventListener('mousedown', e => {
    e.preventDefault();
    setActivePanel(panelIdx);
    const ps = panels[panelIdx];
    if (!ps) return;
    initPanelExtras(ps);

    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const dy = (e.clientY - rect.top)  * (canvas.height / rect.height);

    mouseState.down    = true;
    mouseState.startX  = dx; mouseState.startY = dy;
    mouseState.lastX   = dx; mouseState.lastY  = dy;
    mouseState.panelIdx = panelIdx;

    // Outils ponctuels (rotation, inversion)
    if (activeTool === 'rotate') {
      ps.rotation = (ps.rotation + 90) % 360;
      renderPanelWithTransform(panelIdx);
      mouseState.down = false;
    }
    if (activeTool === 'invert') {
      ps.inverted = !ps.inverted;
      renderPanelWithTransform(panelIdx);
      mouseState.down = false;
    }

    // Début d'annotation
    if (['ruler','angle','roi'].includes(activeTool)) {
      const ip = displayToImage(ps, dx, dy);
      if (!mouseState.pendingAnn) {
        mouseState.pendingAnn = { type: activeTool, pts: [ip], panelIdx };
      } else if (activeTool === 'angle' && mouseState.pendingAnn.pts.length < 3) {
        mouseState.pendingAnn.pts.push(ip);
        if (mouseState.pendingAnn.pts.length === 3) {
          ps.annotations.push({ ...mouseState.pendingAnn });
          mouseState.pendingAnn = null;
        }
      } else {
        ps.annotations.push({ ...mouseState.pendingAnn, pts: [mouseState.pendingAnn.pts[0], ip] });
        mouseState.pendingAnn = null;
      }
      renderPanelWithTransform(panelIdx);
    }
  });

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const dy = (e.clientY - rect.top)  * (canvas.height / rect.height);

    // Aperçu annotation en cours
    if (mouseState.pendingAnn && mouseState.pendingAnn.panelIdx === panelIdx) {
      const ps = panels[panelIdx];
      if (ps) {
        const ip = displayToImage(ps, dx, dy);
        const preview = { ...mouseState.pendingAnn, pts: [...mouseState.pendingAnn.pts, ip] };
        // Redessiner avec aperçu
        renderPanelWithTransform(panelIdx);
        const ctx = canvas.getContext('2d');
        const tmpAnn = [preview];
        const savedAnns = ps.annotations;
        ps.annotations = [...savedAnns, preview];
        drawAnnotations(ctx, ps, ps._displayW, ps._displayH);
        ps.annotations = savedAnns;
      }
    }

    if (!mouseState.down || mouseState.panelIdx !== panelIdx) return;
    const ps = panels[panelIdx];
    if (!ps) return;

    const ddx = dx - mouseState.lastX;
    const ddy = dy - mouseState.lastY;
    mouseState.lastX = dx; mouseState.lastY = dy;

    if (activeTool === 'pan') {
      ps.panX += ddx; ps.panY += ddy;
      renderPanelWithTransform(panelIdx);
    }
    if (activeTool === 'zoom') {
      ps.zoom = Math.max(0.2, Math.min(10, ps.zoom * (1 + ddy * -0.01)));
      renderPanelWithTransform(panelIdx);
    }
    if (activeTool === 'wl') {
      ps.wl = Math.round(ps.wl + ddx * 2);
      ps.ww = Math.max(1, Math.round(ps.ww + ddy * 4));
      syncPanelWlBar(panelIdx);
      renderPanelWithTransform(panelIdx);
      if (panelIdx === activePanelIdx && typeof updateSliceInfo === 'function') updateSliceInfo();
    }
    if (activeTool === 'roi' && mouseState.pendingAnn === null) {
      // ROI drag live
    }
  });

  canvas.addEventListener('mouseup', () => { mouseState.down = false; });
  canvas.addEventListener('mouseleave', () => { mouseState.down = false; });

  // Double-clic : reset zoom/pan
  canvas.addEventListener('dblclick', () => {
    const ps = panels[panelIdx];
    if (!ps) return;
    initPanelExtras(ps);
    ps.zoom = 1; ps.panX = 0; ps.panY = 0;
    renderPanelWithTransform(panelIdx);
  });

  // Clic droit : effacer dernière annotation
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const ps = panels[panelIdx];
    if (!ps) return;
    if (mouseState.pendingAnn) { mouseState.pendingAnn = null; }
    else if (ps.annotations.length > 0) { ps.annotations.pop(); }
    renderPanelWithTransform(panelIdx);
  });
}

// ── Surcharge renderPanelSlice pour utiliser le rendu transformé ─
const _origRenderPanelSlice = renderPanelSlice;
function renderPanelSlice(panelIdx, sliceIdx) {
  const ps = panels[panelIdx];
  if (!ps) return;
  const slices = ps.series?.slices;
  if (!slices?.length) return;
  const si = Math.max(0, Math.min(sliceIdx, slices.length - 1));
  ps.sliceIdx = si;

  // Mettre à jour l'info
  const slice  = slices[si];
  const infoEl = document.getElementById(`panelInfo${panelIdx}`);
  if (infoEl) infoEl.textContent = `${slice.rows}×${slice.cols}  Im ${si+1}/${slices.length}${slice.st ? '  Ép '+slice.st+'mm' : ''}`;

  // Filmstrip highlight
  const fs = document.getElementById(`filmstrip${panelIdx}`);
  if (fs) {
    fs.querySelectorAll('.mp-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === si);
      if (i === si) t.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
    });
  }

  // Mettre à jour le panneau patient si c'est le panneau actif
  if (panelIdx === activePanelIdx) updateSliceInfo();

  initPanelExtras(ps);
  renderPanelWithTransform(panelIdx);
}

document.addEventListener('DOMContentLoaded', () => {

  // ── Afficher les patients fictifs au démarrage ───────────────
  buildWorklist();

  // ── Molette : scroll coupes ─────────────────────────────────
  document.getElementById('viewerArea').addEventListener('wheel', e => {
    e.preventDefault();
    const ps = panels[activePanelIdx];
    if (!ps) return;
    if (e.ctrlKey) {
      // Ctrl+molette = zoom
      initPanelExtras(ps);
      ps.zoom = Math.max(0.2, Math.min(10, ps.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
      renderPanelWithTransform(activePanelIdx);
    } else {
      const delta = e.deltaY > 0 ? 1 : -1;
      renderPanelSlice(activePanelIdx, ps.sliceIdx + delta);
    }
  }, { passive: false });

  // ── Sliders WL/WW ──────────────────────────────────────────
  // Sliders WL/WW gérés par panneau (buildPanelWlBar)

  // ── Toolbar : sélection outil ───────────────────────────────
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', function() {
      const tool = this.dataset.tool;

      // Outils avec état toggle (rotate/invert) = pas de sélection persistante
      if (tool === 'rotate' || tool === 'invert') {
        activeTool = tool;
        // Appliquer immédiatement sur panneau actif
        const ps = panels[activePanelIdx];
        if (ps) {
          initPanelExtras(ps);
          if (tool === 'rotate') { ps.rotation = (ps.rotation + 90) % 360; }
          if (tool === 'invert') { ps.inverted = !ps.inverted; }
          renderPanelWithTransform(activePanelIdx);
        }
        activeTool = 'select';
        // Remettre active sur select
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        document.querySelector('.tool-btn[data-tool="select"]').classList.add('active');
        return;
      }

      // Sélection outil normal
      activeTool = tool;
      mouseState.pendingAnn = null;

      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Curseur sur tous les canvas
      document.querySelectorAll('.mp-canvas-wrap canvas').forEach(c => {
        c.style.cursor = TOOL_CURSORS[tool] || 'default';
      });

      // Nom de l'outil dans la toolbar
      const label = document.getElementById('toolLabelMain');
      if (label) {
        label.style.color = 'rgba(0,200,255,0.6)';
        label.textContent = TOOL_NAMES[tool] || tool;
      }
    });
  });

  // Attacher les events souris aux panneaux (appelé aussi après buildViewerPanels)
  window.attachAllPanelEvents = function() {
    document.querySelectorAll('.mp-canvas-wrap').forEach((wrap, i) => {
      attachPanelEvents(wrap, i);
      const canvas = wrap.querySelector('canvas');
      if (canvas) canvas.style.cursor = TOOL_CURSORS[activeTool] || 'default';
    });
  };

});

/* ── TABS ── */
function switchTab(name, el) {
  document.querySelectorAll('.rptab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.rpanel-body').forEach(b => b.classList.add('hidden'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.remove('hidden');
  // Pause/resume le renderer 3D panneau selon visibilité
  if (name !== 'vol3d' && _panel3D.animId) {
    cancelAnimationFrame(_panel3D.animId);
    _panel3D.animId = null;
  }
  if (name === 'vol3d' && _panel3D.renderer && !_panel3D.animId) {
    _panel3DAnimate();
  }
}

/* ════════════════════════════════════════════════════════════════
   VUE 3D PATIENT — panneau droit, toutes séquences
   ════════════════════════════════════════════════════════════════ */
const _panel3D = {
  renderer: null, scene: null, camera: null, mesh: null, mat: null,
  uniforms: null, texture: null, animId: null,
  rotX: -0.25, rotY: 0.4, dist: 2.0, pivot: null,
  dragging: false, lastX: 0, lastY: 0, shift: false,
  pan: null, currentSeriesIdx: 0, mode: 'MIP', ro: null,
  autoSpin: false, spinSpeed: 0.008,
};

function launchPanel3D() {
  // Construire les boutons de séquences si DICOM chargé
  _buildPanel3DSeqBtns();
  if (!dicomSeries.length) return;
  if (!_panel3D.renderer) {
    _initPanel3DRenderer();
  }
  // Charger la première série si pas encore fait
  if (!_panel3D.texture) {
    _loadPanel3DSeries(0);
  }
}

function _buildPanel3DSeqBtns() {
  const wrap = document.getElementById('v3dpSeqBtns');
  if (!wrap) return;
  wrap.innerHTML = '';
  dicomSeries.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'v3dp-seq-btn' + (i === _panel3D.currentSeriesIdx ? ' active' : '');
    btn.textContent = s.desc;
    btn.style.setProperty('--seq-color', seriesAccentColor(s.desc));
    btn.addEventListener('click', () => {
      _panel3D.currentSeriesIdx = i;
      wrap.querySelectorAll('.v3dp-seq-btn').forEach((b, bi) =>
        b.classList.toggle('active', bi === i));
      _loadPanel3DSeries(i);
    });
    wrap.appendChild(btn);
  });
}

function _initPanel3DRenderer() {
  const wrap = document.getElementById('v3dpWrap');
  if (!wrap || typeof THREE === 'undefined') return;

  document.getElementById('v3dpEmpty').style.display = 'none';

  const W = wrap.clientWidth  || 280;
  const H = wrap.clientHeight || 320;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x020408, 1);
  wrap.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.01, 10);
  camera.position.z = _panel3D.dist;

  const pivot = new THREE.Object3D();
  scene.add(pivot);
  pivot.add(camera);
  _panel3D.pan = new THREE.Vector3();

  Object.assign(_panel3D, { renderer, scene, camera, pivot });

  // Orbit controls
  const el = renderer.domElement;

  el.addEventListener('mousedown', e => {
    _panel3D.dragging = true; _panel3D.shift = e.shiftKey;
    _panel3D.lastX = e.clientX; _panel3D.lastY = e.clientY;
    e.preventDefault();
  });
  el.addEventListener('mousemove', e => {
    if (!_panel3D.dragging) return;
    const dx = (e.clientX - _panel3D.lastX) * 0.009;
    const dy = (e.clientY - _panel3D.lastY) * 0.009;
    _panel3D.lastX = e.clientX; _panel3D.lastY = e.clientY;
    if (e.shiftKey) {
      _panel3D.pan.x += dx * 0.3;
      _panel3D.pan.y -= dy * 0.3;
    } else {
      _panel3D.rotY += dx;
      _panel3D.rotX  = Math.max(-Math.PI/2, Math.min(Math.PI/2, _panel3D.rotX + dy));
    }
    _applyPanel3DOrbit();
  });
  window.addEventListener('mouseup', () => { _panel3D.dragging = false; });
  el.addEventListener('wheel', e => {
    _panel3D.dist = Math.max(0.7, Math.min(4.5, _panel3D.dist + e.deltaY * 0.003));
    _applyPanel3DOrbit();
    e.preventDefault();
  }, { passive: false });

  // Touch
  let lastPinch = 0;
  el.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      _panel3D.dragging = true;
      _panel3D.lastX = e.touches[0].clientX;
      _panel3D.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      lastPinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                             e.touches[0].clientY - e.touches[1].clientY);
    }
    e.preventDefault();
  }, { passive: false });
  el.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && _panel3D.dragging) {
      const dx = (e.touches[0].clientX - _panel3D.lastX) * 0.009;
      const dy = (e.touches[0].clientY - _panel3D.lastY) * 0.009;
      _panel3D.lastX = e.touches[0].clientX;
      _panel3D.lastY = e.touches[0].clientY;
      _panel3D.rotY += dx;
      _panel3D.rotX  = Math.max(-Math.PI/2, Math.min(Math.PI/2, _panel3D.rotX + dy));
      _applyPanel3DOrbit();
    } else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                           e.touches[0].clientY - e.touches[1].clientY);
      _panel3D.dist = Math.max(0.7, Math.min(4.5, _panel3D.dist - (d - lastPinch) * 0.006));
      lastPinch = d;
      _applyPanel3DOrbit();
    }
    e.preventDefault();
  }, { passive: false });
  el.addEventListener('touchend', () => { _panel3D.dragging = false; });

  // Resize
  const ro = new ResizeObserver(() => {
    if (!_panel3D.renderer) return;
    const nw = wrap.clientWidth, nh = wrap.clientHeight;
    if (nw < 10 || nh < 10) return;
    _panel3D.renderer.setSize(nw, nh);
    _panel3D.camera.aspect = nw / nh;
    _panel3D.camera.updateProjectionMatrix();
  });
  ro.observe(wrap);
  _panel3D.ro = ro;

  _applyPanel3DOrbit();
  _panel3DAnimate();
}

function _applyPanel3DOrbit() {
  const p = _panel3D;
  if (!p.pivot) return;
  p.pivot.rotation.x = p.rotX;
  p.pivot.rotation.y = p.rotY;
  p.camera.position.z = p.dist;
  p.pivot.position.copy(p.pan);
}

function _panel3DAnimate() {
  _panel3D.animId = requestAnimationFrame(_panel3DAnimate);
  if (_panel3D.autoSpin && !_panel3D.dragging) {
    _panel3D.rotY += _panel3D.spinSpeed;
    _applyPanel3DOrbit();
  }
  if (_panel3D.renderer && _panel3D.scene && _panel3D.camera) {
    _panel3D.renderer.render(_panel3D.scene, _panel3D.camera);
  }
}

async function _loadPanel3DSeries(seriesIdx) {
  const series = dicomSeries[seriesIdx];
  if (!series?.slices?.length) return;

  document.getElementById('v3dpStat').textContent = 'Construction du volume…';
  document.getElementById('v3dpSeriesName').textContent = series.desc;
  document.getElementById('v3dpControls').style.display = 'flex';

  const slices = series.slices;
  const N      = slices.length;
  const ps     = panels.find(p => p.series?.uid === series.uid) || panels[seriesIdx] || panels[0];
  const wl     = ps?.wl ?? 500;
  const ww     = ps?.ww ?? 2000;

  // Résolution adaptée à la petite taille du panneau
  const MAX_DIM = 96;
  const srcW = slices[0].cols || 256;
  const srcH = slices[0].rows || 256;
  const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH, N));
  const volW  = Math.max(32, Math.round(srcW * scale));
  const volH  = Math.max(32, Math.round(srcH * scale));
  const volD  = Math.min(N, MAX_DIM);
  const step  = Math.max(1, Math.floor(N / volD));

  const data3D = new Uint8Array(volW * volH * volD);
  const tmp    = document.createElement('canvas');
  tmp.width = volW; tmp.height = volH;
  const tCtx = tmp.getContext('2d');

  for (let z = 0; z < volD; z++) {
    const sl = slices[Math.min(Math.round(z * step), N - 1)];
    const fc = document.createElement('canvas');
    renderSliceOnCanvas(fc, sl, wl, ww);
    tCtx.drawImage(fc, 0, 0, volW, volH);
    const d = tCtx.getImageData(0, 0, volW, volH).data;
    const zO = z * volW * volH;
    for (let i = 0; i < volW * volH; i++) data3D[zO + i] = d[i * 4];
    if (z % 12 === 0) await new Promise(r => setTimeout(r, 0));
  }

  // Supprimer l'ancienne texture/mesh
  if (_panel3D.texture) { _panel3D.texture.dispose(); _panel3D.texture = null; }
  if (_panel3D.mesh) {
    _panel3D.scene.remove(_panel3D.mesh);
    _panel3D.mesh.geometry.dispose();
    _panel3D.mat.dispose();
  }

  // Texture 3D
  const texture = new THREE.DataTexture3D(data3D, volW, volH, volD);
  texture.format = THREE.RedFormat;
  texture.type   = THREE.UnsignedByteType;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  _panel3D.texture = texture;

  // Couleur selon séquence
  const seqKey = getSeqKey(series.desc) || 'DEFAULT';
  const seqCols = {
    FLAIR: [0.0, 0.86, 1.0], T1W: [1.0, 0.71, 0.20],
    T1WCE: [0.66, 0.33, 0.97], T2W: [0.0, 1.0, 0.62],
    DWI: [1.0, 0.39, 0.39], DEFAULT: [0.0, 0.78, 1.0],
  };
  const [cr, cg, cb] = seqCols[seqKey] || seqCols.DEFAULT;

  // Seuil adapté
  const threshMap = { FLAIR: 22, T1W: 15, T1WCE: 18, T2W: 20, DWI: 28, DEFAULT: 20 };
  const thresh0   = threshMap[seqKey] || 20;
  const sl3 = document.getElementById('v3dpThresh');
  if (sl3) sl3.value = thresh0;

  const uniforms = {
    uVolume:   { value: texture },
    uAlpha:    { value: 0.65 },
    uThreshLo: { value: thresh0 / 255 },
    uMode:     { value: 0 },
    uColor:    { value: new THREE.Vector3(cr, cg, cb) },
  };
  _panel3D.uniforms = uniforms;

  // Shaders (réutilise les mêmes que open3DView)
  const vert = `
    varying vec3 vOrigin; varying vec3 vDir;
    void main() {
      vOrigin = (inverse(modelMatrix) * vec4(cameraPosition,1.0)).xyz + 0.5;
      vDir    = position + 0.5 - vOrigin;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }`;
  const frag = `
    precision highp float; precision highp sampler3D;
    uniform sampler3D uVolume; uniform float uAlpha; uniform float uThreshLo;
    uniform int uMode; uniform vec3 uColor;
    varying vec3 vOrigin; varying vec3 vDir;
    vec2 hitBox(vec3 o, vec3 d) {
      vec3 inv=1.0/d, t1=(-.5-o)*inv, t2=(.5-o)*inv;
      vec3 a=min(t1,t2), b=max(t1,t2);
      return vec2(max(max(a.x,a.y),a.z), min(min(b.x,b.y),b.z));
    }
    vec3 grad(vec3 p) {
      float e=0.007;
      return normalize(vec3(
        texture(uVolume,p+vec3(e,0,0)).r-texture(uVolume,p-vec3(e,0,0)).r,
        texture(uVolume,p+vec3(0,e,0)).r-texture(uVolume,p-vec3(0,e,0)).r,
        texture(uVolume,p+vec3(0,0,e)).r-texture(uVolume,p-vec3(0,0,e)).r
      ));
    }
    void main() {
      vec3 rd=normalize(vDir);
      vec2 b=hitBox(vOrigin,rd);
      if(b.x>=b.y){discard;return;}
      b.x=max(b.x,0.0);
      float dt=0.005, t=b.x, mip=0.0; vec4 acc=vec4(0);
      for(int i=0;i<360;i++){
        if(t>=b.y||acc.a>=0.97) break;
        vec3 p=vOrigin+rd*t;
        float s=texture(uVolume,p+0.5).r;
        if(uMode==0){ mip=max(mip,s); }
        else if(uMode==1){
          if(s>uThreshLo){
            float dens=(s-uThreshLo)/(1.0-uThreshLo);
            float lit=0.3+max(dot(grad(p+0.5),normalize(vec3(1,1,.5))),0.0)*0.7;
            float a=dens*uAlpha*dt*70.0;
            acc.rgb+=(1.0-acc.a)*uColor*lit*a;
            acc.a  +=(1.0-acc.a)*a;
          }
        } else {
          float stripe=step(0.498,mod((p.z+0.5)*10.0,1.0));
          float sp=s*(1.0-stripe*0.25);
          if(sp>uThreshLo&&acc.a<0.6){
            float a=sp*uAlpha*0.35;
            acc.rgb+=(1.0-acc.a)*uColor*sp*a;
            acc.a  +=(1.0-acc.a)*a;
          }
        }
        t+=dt;
      }
      if(uMode==0){
        float a=mip>uThreshLo?mip*uAlpha:0.0;
        gl_FragColor=vec4(uColor*mip*a+vec3(mip*.1)*a,a);
      } else { gl_FragColor=acc; }
      if(gl_FragColor.a<0.004) discard;
    }`;

  const stThick = slices[0]?.st || 1;
  const aspect  = new THREE.Vector3(1, srcH / srcW, (volD * stThick) / srcW);
  const geo = new THREE.BoxGeometry(aspect.x, aspect.y, aspect.z);
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: vert, fragmentShader: frag,
    side: THREE.BackSide, transparent: true, depthTest: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  _panel3D.scene.add(mesh);
  _panel3D.mesh = mesh;
  _panel3D.mat  = mat;

  // Axes
  _panel3D.scene.children
    .filter(c => c.isLineSegments)
    .forEach(c => _panel3D.scene.remove(c));
  const axGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.65,-.6,0), new THREE.Vector3(.65,-.6,0),
    new THREE.Vector3(0,-.6,-.65), new THREE.Vector3(0,-.6,.65),
  ]);
  _panel3D.scene.add(new THREE.LineSegments(axGeo,
    new THREE.LineBasicMaterial({ color: 0x0a1828 })));

  document.getElementById('v3dpStat').textContent =
    `${volW}×${volH}×${volD} vox · ${N} coupes · ${series.desc}`;
}

function setPanel3DMode(mode) {
  _panel3D.mode = mode;
  ['MIP','DVR','SLAB'].forEach(m =>
    document.getElementById('v3dp' + m)?.classList.toggle('active', m === mode));
  if (_panel3D.uniforms)
    _panel3D.uniforms.uMode.value = mode === 'MIP' ? 0 : mode === 'DVR' ? 1 : 2;
}

function updatePanel3DParam(p, v) {
  const val = parseFloat(v);
  if (!_panel3D.uniforms) return;
  if (p === 'thresh')    _panel3D.uniforms.uThreshLo.value = val / 255;
  if (p === 'alpha')     _panel3D.uniforms.uAlpha.value    = val / 100;
  if (p === 'spinSpeed') _panel3D.spinSpeed                = val / 1000;
}

function togglePanel3DSpin() {
  _panel3D.autoSpin = !_panel3D.autoSpin;
  const btn = document.getElementById('v3dpSpinBtn');
  if (btn) {
    btn.classList.toggle('active', _panel3D.autoSpin);
    btn.textContent = _panel3D.autoSpin ? '⏸' : '▶';
  }
}

function resetPanel3DCamera() {
  Object.assign(_panel3D, { rotX: -0.25, rotY: 0.4, dist: 2.0 });
  if (_panel3D.pan) _panel3D.pan.set(0, 0, 0);
  _applyPanel3DOrbit();
}

// Appeler lors du chargement DICOM pour pré-préparer les boutons
function _refreshPanel3DBtns() {
  if (document.getElementById('tab-vol3d')?.classList.contains('hidden')) return;
  _buildPanel3DSeqBtns();
  if (_panel3D.renderer && dicomSeries.length)
    _loadPanel3DSeries(_panel3D.currentSeriesIdx);
}

function clearReport() {
  document.getElementById('reportText').value = '';
  document.getElementById('reportMeta').textContent = '';
  document.getElementById('reportSignature').style.display = 'none';
}

function copyReport() {
  const text = document.getElementById('reportText').value;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = '✓ Copié';
    setTimeout(() => btn.textContent = '⎘ Copier', 1500);
  });
}

function validateReport() {
  const text = document.getElementById('reportText').value.trim();
  if (!text) { alert("Le rapport est vide."); return; }
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} à ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const sig = document.getElementById('reportSignature');
  sig.style.display = 'block';
  sig.innerHTML = `✓ Validé par Dr. Graziani — ${dateStr}<br>Rapport enregistré · Visionneuse PACS`;
  const reportMeta = document.getElementById('reportMeta');
  if (reportMeta) reportMeta.textContent = `Validé · ${dateStr} · Dr. Graziani`;
}

function appendMessage(role, text) {
  const msgs = document.getElementById('dmMessages');
  const div  = document.createElement('div');
  div.className = 'dm-msg dm-msg-' + role;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

/* ════════════════════════════════════════════════════════════
   VUE 3D PATIENT — 4 volumes simultanés (FLAIR/T1W/T1WCE/T2W)
   Raycasting GPU, orbite synchronisée, contrôles globaux
════════════════════════════════════════════════════════════ */

const P3D_SLOTS = [
  { id:0, key:'FLAIR',  label:'FLAIR',  rgb:[0.0,0.86,1.0],   thresh:22, wlPreset:'FLAIR'  },
  { id:1, key:'T1W',    label:'T1W',    rgb:[1.0,0.71,0.2],   thresh:15, wlPreset:'T1W'    },
  { id:2, key:'T1WCE',  label:'T1W+CE', rgb:[0.66,0.33,0.97], thresh:18, wlPreset:'T1WCE'  },
  { id:3, key:'T2W',    label:'T2W',    rgb:[0.0,1.0,0.62],   thresh:20, wlPreset:'T2W'    },
];

// État global partagé entre les 4 cellules
const p3d = {
  slots: [],        // { renderer, uniforms, pivot, animId, ro, setOrbit }
  mode: 'MIP',      // MIP | DVR | SLAB
  opacity: 0.65,
  thresh: 20/255,
  light: 0.55,
  sync: true,
  // Orbite commune
  rotX: -0.25, rotY: 0.35, dist: 1.85,
  drag: false, shiftDrag: false, lastX: 0, lastY: 0, activeSlot: -1,
};

function open3DPatientView() {
  if (!panels || !panels.some(p => p.series?.slices?.length)) {
    alert('Chargez d\'abord un dossier DICOM.');
    return;
  }
  close3DPatientView();

  const pat  = (typeof dicomMeta !== 'undefined' ? dicomMeta.patientName : '') || 'Patient';
  const mod  = (typeof dicomMeta !== 'undefined' ? dicomMeta.modality   : '') || '';
  const nSer = (typeof dicomSeries !== 'undefined' ? dicomSeries.length : 0);

  const ov = document.createElement('div');
  ov.id = 'p3dOverlay';
  ov.className = 'p3d-overlay';
  ov.innerHTML = `
    <div class="p3d-hdr">
      <div class="p3d-hdr-left">
        <div class="p3d-hdr-title">⬡ VUE 3D PATIENT</div>
        <div class="p3d-hdr-pat" id="p3dHdrPat">${pat}${mod?' · '+mod:''} · ${nSer} série${nSer>1?'s':''}</div>
      </div>
      <div class="p3d-hdr-right">
        <div class="p3d-hint">🖱 Orbite · Scroll: zoom · Shift: déplacer</div>
        <button class="p3d-close" onclick="close3DPatientView()" title="Fermer (Échap)">✕</button>
      </div>
    </div>

    <div class="p3d-grid" id="p3dGrid">
      ${P3D_SLOTS.map(s => `
        <div class="p3d-cell" id="p3dCell${s.id}">
          <div class="p3d-cell-hdr">
            <div class="p3d-cell-name" style="color:rgb(${s.rgb.map(c=>Math.round(c*255)).join(',')})">${s.label}</div>
            <div class="p3d-cell-info" id="p3dCellInfo${s.id}">—</div>
          </div>
          <div class="p3d-canvas-wrap" id="p3dWrap${s.id}"></div>
          <div class="p3d-cell-loading" id="p3dLoad${s.id}">
            <div class="p3d-spinner" style="border-top-color:rgb(${s.rgb.map(c=>Math.round(c*255)).join(',')})"></div>
            <div class="p3d-load-txt" id="p3dLoadTxt${s.id}">Recherche de la série…</div>
          </div>
        </div>`).join('')}
    </div>

    <div class="p3d-footer">
      <div class="p3d-foot-label">Mode</div>
      <div class="p3d-mode-group">
        <button class="p3d-mode-btn active" id="p3dBtnMIP"  onclick="p3dSetMode('MIP')">MIP</button>
        <button class="p3d-mode-btn"        id="p3dBtnDVR"  onclick="p3dSetMode('DVR')">Volume</button>
        <button class="p3d-mode-btn"        id="p3dBtnSLAB" onclick="p3dSetMode('SLAB')">Coupes</button>
      </div>
      <div class="p3d-sl-wrap">
        <div class="p3d-foot-label">Opacité</div>
        <input type="range" class="p3d-slider" id="p3dSlOp" min="1" max="100" value="65"
          oninput="p3dSetParam('opacity',this.value)">
        <span class="p3d-sl-label" id="p3dOpVal">65%</span>
      </div>
      <div class="p3d-sl-wrap">
        <div class="p3d-foot-label">Seuil</div>
        <input type="range" class="p3d-slider" id="p3dSlTh" min="0" max="80" value="20"
          oninput="p3dSetParam('thresh',this.value)">
        <span class="p3d-sl-label" id="p3dThVal">20</span>
      </div>
      <div class="p3d-sl-wrap">
        <div class="p3d-foot-label">Éclairage</div>
        <input type="range" class="p3d-slider" id="p3dSlLt" min="0" max="100" value="55"
          oninput="p3dSetParam('light',this.value)">
      </div>
      <label class="p3d-sync-label">
        <input type="checkbox" id="p3dSyncChk" checked onchange="p3d.sync=this.checked">
        Orbite sync
      </label>
      <div class="p3d-foot-stat" id="p3dStat">Chargement…</div>
    </div>`;

  document.body.appendChild(ov);
  document.addEventListener('keydown', _p3dKeyHandler);
  window.addEventListener('mouseup', _p3dMouseUp);

  // Reset état orbite
  p3d.slots = [null, null, null, null];
  p3d.drag = false;

  // Trouver les séries pour chaque slot
  const slotSeries = P3D_SLOTS.map(sl => _p3dFindSeries(sl.key));

  // Lancer la construction en parallèle (décalé de 80ms entre chaque pour ne pas bloquer le paint)
  P3D_SLOTS.forEach((sl, i) => {
    setTimeout(() => _p3dBuildSlot(sl, slotSeries[i]), i * 100);
  });
}

function _p3dFindSeries(key) {
  if (typeof dicomSeries === 'undefined') return null;
  return dicomSeries.find(s => {
    const d = (s.desc || '').toUpperCase();
    if (key === 'FLAIR')  return d.includes('FLAIR');
    if (key === 'T1WCE')  return d.includes('T1WCE') || d.includes('T1W+C') || d.includes('T1+C') || (d.includes('T1') && d.includes('CE'));
    if (key === 'T1W')    return d.includes('T1') && !d.includes('CE') && !d.includes('WCE');
    if (key === 'T2W')    return d.includes('T2');
    return false;
  }) || null;
}

function _p3dKeyHandler(e) { if (e.key === 'Escape') close3DPatientView(); }
function _p3dMouseUp()     { p3d.drag = false; }

function close3DPatientView() {
  document.removeEventListener('keydown', _p3dKeyHandler);
  window.removeEventListener('mouseup', _p3dMouseUp);
  (p3d.slots || []).forEach(s => s?.dispose());
  p3d.slots = [];
  document.getElementById('p3dOverlay')?.remove();
}

function p3dSetMode(mode) {
  p3d.mode = mode;
  ['MIP','DVR','SLAB'].forEach(m =>
    document.getElementById(`p3dBtn${m}`)?.classList.toggle('active', m === mode));
  const v = mode==='MIP'?0:mode==='DVR'?1:2;
  (p3d.slots||[]).forEach(s => { if (s?.uniforms) s.uniforms.uMode.value = v; });
}

function p3dSetParam(param, val) {
  const n = parseFloat(val);
  if (param === 'opacity') {
    p3d.opacity = n/100;
    document.getElementById('p3dOpVal').textContent = Math.round(n)+'%';
    (p3d.slots||[]).forEach(s => { if (s?.uniforms) s.uniforms.uAlpha.value = p3d.opacity; });
  }
  if (param === 'thresh') {
    p3d.thresh = n/255;
    document.getElementById('p3dThVal').textContent = Math.round(n);
    (p3d.slots||[]).forEach(s => { if (s?.uniforms) s.uniforms.uThreshLo.value = p3d.thresh; });
  }
  if (param === 'light') {
    p3d.light = n/100;
    (p3d.slots||[]).forEach(s => { if (s?.uniforms) s.uniforms.uLight.value = p3d.light; });
  }
}

/* ── Construction d'un volume pour un slot ── */
async function _p3dBuildSlot(slotDef, series) {
  const { id } = slotDef;
  const loadEl  = document.getElementById(`p3dLoad${id}`);
  const loadTxt = document.getElementById(`p3dLoadTxt${id}`);
  const infoEl  = document.getElementById(`p3dCellInfo${id}`);
  const wrapEl  = document.getElementById(`p3dWrap${id}`);

  if (!series?.slices?.length) {
    // Cas : série absente
    if (loadTxt) loadTxt.textContent = 'Série non disponible';
    if (loadEl) {
      loadEl.querySelector('.p3d-spinner').style.display = 'none';
      loadEl.style.background = 'rgba(2,5,9,0.7)';
    }
    _p3dCheckAllDone();
    return;
  }

  const slices = series.slices;
  const N      = slices.length;

  // WL du panneau correspondant ou défaut par séquence
  const panelForSeries = panels.find(p => p.series?.uid === series.uid);
  const wl = panelForSeries?.wl ?? (WL_PARAMS[slotDef.wlPreset]?.wl ?? 500);
  const ww = panelForSeries?.ww ?? (WL_PARAMS[slotDef.wlPreset]?.ww ?? 2000);

  // Résolution : 96³ max pour tenir à 4 volumes simultanés
  const MAX_DIM = 96;
  const srcW    = slices[0].cols || 256;
  const srcH    = slices[0].rows || 256;
  const sc      = Math.min(1, MAX_DIM / Math.max(srcW, srcH, N));
  const volW    = Math.max(24, Math.round(srcW * sc));
  const volH    = Math.max(24, Math.round(srcH * sc));
  const volD    = Math.min(N, MAX_DIM);
  const step    = Math.max(1, Math.floor(N / volD));

  if (loadTxt) loadTxt.textContent = `Construction ${volW}×${volH}×${volD}…`;

  // Remplir le tableau voxel
  const data3D   = new Uint8Array(volW * volH * volD);
  const tmpC     = document.createElement('canvas');
  tmpC.width = volW; tmpC.height = volH;
  const tmpCtx   = tmpC.getContext('2d');

  for (let z = 0; z < volD; z++) {
    const sl  = slices[Math.min(Math.round(z * step), N - 1)];
    const fc  = document.createElement('canvas');
    renderSliceOnCanvas(fc, sl, wl, ww);
    tmpCtx.drawImage(fc, 0, 0, volW, volH);
    const px  = tmpCtx.getImageData(0, 0, volW, volH).data;
    const off = z * volW * volH;
    for (let i = 0; i < volW * volH; i++) data3D[off + i] = px[i * 4];
    if (z % 20 === 0) {
      if (loadTxt) loadTxt.textContent = `Voxels… ${Math.round(z/volD*100)}%`;
      await new Promise(r => setTimeout(r, 0));
    }
  }

  if (loadTxt) loadTxt.textContent = 'Rendu GPU…';

  // Texture 3D
  const tex = new THREE.DataTexture3D(data3D, volW, volH, volD);
  tex.format = THREE.RedFormat;
  tex.type   = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;

  // Shaders raycasting MIP / DVR / SLAB
  const [cr, cg, cb] = slotDef.rgb;
  const vert = `
    varying vec3 vOrig;
    varying vec3 vDir;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vOrig = (inverse(modelMatrix)*vec4(cameraPosition,1.0)).xyz + 0.5;
      vDir  = position + 0.5 - vOrig;
      gl_Position = projectionMatrix * mv;
    }`;
  const frag = `
    precision highp float;
    precision highp sampler3D;
    uniform sampler3D uVol;
    uniform float uAlpha, uLight, uThreshLo;
    uniform int   uMode;
    uniform vec3  uColor;
    varying vec3 vOrig, vDir;

    vec2 hitBox(vec3 o, vec3 d) {
      vec3 iv=1.0/d, t1=(-0.5-o)*iv, t2=(0.5-o)*iv;
      vec3 mn=min(t1,t2), mx=max(t1,t2);
      return vec2(max(max(mn.x,mn.y),mn.z), min(min(mx.x,mx.y),mx.z));
    }
    vec3 grad(vec3 p) {
      float e=0.007;
      return normalize(vec3(
        texture(uVol,p+vec3(e,0,0)).r-texture(uVol,p-vec3(e,0,0)).r,
        texture(uVol,p+vec3(0,e,0)).r-texture(uVol,p-vec3(0,e,0)).r,
        texture(uVol,p+vec3(0,0,e)).r-texture(uVol,p-vec3(0,0,e)).r));
    }
    void main() {
      vec3 rd = normalize(vDir);
      vec2 b  = hitBox(vOrig,rd);
      if (b.x>=b.y) { discard; return; }
      b.x = max(b.x,0.0);
      float dt=0.004, mip=0.0;
      vec4 acc=vec4(0.0);
      for (int i=0;i<400;i++) {
        float t=b.x+float(i)*dt;
        if (t>=b.y||acc.a>=0.97) break;
        vec3  p=vOrig+rd*t;
        float s=texture(uVol,p+0.5).r;
        if (uMode==0) {
          mip=max(mip,s);
        } else if (uMode==1) {
          if (s>uThreshLo) {
            vec3 N=grad(p+0.5);
            float lit=0.28+max(dot(N,normalize(vec3(0.7,1.0,0.5))),0.0)*uLight;
            float a=(s-uThreshLo)*uAlpha*dt*75.0;
            acc.rgb+=(1.0-acc.a)*uColor*lit*a;
            acc.a  +=(1.0-acc.a)*a;
          }
        } else {
          float z2=p.z+0.5;
          float st=step(0.492,mod(z2*13.0,1.0));
          float sp=s*(1.0-st*0.3);
          if (sp>uThreshLo&&acc.a<0.5) {
            float a=sp*uAlpha*0.36;
            acc.rgb+=(1.0-acc.a)*uColor*sp*a;
            acc.a  +=(1.0-acc.a)*a;
          }
        }
      }
      if (uMode==0) {
        float a=mip>uThreshLo?mip*uAlpha:0.0;
        gl_FragColor=vec4(uColor*mip*a+0.08*mip*a,a);
      } else { gl_FragColor=acc; }
      if (gl_FragColor.a<0.004) discard;
    }`;

  const W = wrapEl.clientWidth  || 400;
  const H = wrapEl.clientHeight || 300;

  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x020509, 1);
  wrapEl.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W/H, 0.01, 10);

  const st  = slices[0]?.st || 1;
  const geo = new THREE.BoxGeometry(1, srcH/srcW, Math.min((volD*st)/srcW, 1.5));

  const uniforms = {
    uVol:      { value: tex },
    uAlpha:    { value: p3d.opacity },
    uLight:    { value: p3d.light },
    uThreshLo: { value: slotDef.thresh/255 },
    uMode:     { value: 0 },
    uColor:    { value: new THREE.Vector3(cr,cg,cb) },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert, fragmentShader: frag,
    side: THREE.BackSide, transparent:true, depthTest:false,
  });

  scene.add(new THREE.Mesh(geo, mat));

  // Pivot orbite
  const pivot = new THREE.Object3D();
  scene.add(pivot);
  pivot.add(camera);

  let rotX = p3d.rotX, rotY = p3d.rotY, dist = p3d.dist;
  let panX = 0, panY = 0;

  function applyOrbit() {
    pivot.rotation.x = rotX;
    pivot.rotation.y = rotY;
    camera.position.z = dist;
    pivot.position.set(panX, panY, 0);
  }
  applyOrbit();

  // Événements souris
  const el = renderer.domElement;
  el.addEventListener('mousedown', e => {
    p3d.drag = true; p3d.activeSlot = id;
    p3d.lastX = e.clientX; p3d.lastY = e.clientY;
    p3d.shiftDrag = e.shiftKey;
    e.preventDefault();
  });
  el.addEventListener('mousemove', e => {
    if (!p3d.drag || p3d.activeSlot !== id) return;
    const dx = (e.clientX - p3d.lastX) * 0.007;
    const dy = (e.clientY - p3d.lastY) * 0.007;
    p3d.lastX = e.clientX; p3d.lastY = e.clientY;
    if (e.shiftKey) { panX += dx*0.4; panY -= dy*0.4; }
    else {
      rotY += dx; rotX += dy;
      rotX = Math.max(-1.5, Math.min(1.5, rotX));
      if (p3d.sync) {
        p3d.rotX = rotX; p3d.rotY = rotY;
        (p3d.slots||[]).forEach((s,i) => { if (i!==id && s) s.setOrbit(rotX, rotY, dist); });
      }
    }
    applyOrbit();
  });
  el.addEventListener('wheel', e => {
    dist = Math.max(0.5, Math.min(4.5, dist + e.deltaY*0.002));
    if (p3d.sync) {
      p3d.dist = dist;
      (p3d.slots||[]).forEach((s,i) => { if (i!==id && s) s.setOrbit(p3d.rotX, p3d.rotY, dist); });
    }
    applyOrbit();
    e.preventDefault();
  }, { passive:false });

  // Touch
  let ltd = 0;
  el.addEventListener('touchstart', e => {
    p3d.activeSlot = id;
    if (e.touches.length===1) { p3d.drag=true; p3d.lastX=e.touches[0].clientX; p3d.lastY=e.touches[0].clientY; }
    else if (e.touches.length===2) ltd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
    e.preventDefault();
  },{ passive:false });
  el.addEventListener('touchmove', e => {
    if (e.touches.length===1 && p3d.drag && p3d.activeSlot===id) {
      const dx=(e.touches[0].clientX-p3d.lastX)*0.007, dy=(e.touches[0].clientY-p3d.lastY)*0.007;
      p3d.lastX=e.touches[0].clientX; p3d.lastY=e.touches[0].clientY;
      rotY+=dx; rotX+=dy; rotX=Math.max(-1.5,Math.min(1.5,rotX));
      if(p3d.sync){p3d.rotX=rotX;p3d.rotY=rotY;(p3d.slots||[]).forEach((s,i)=>{if(i!==id&&s)s.setOrbit(rotX,rotY,dist);});}
      applyOrbit();
    } else if (e.touches.length===2) {
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      dist=Math.max(0.5,Math.min(4.5,dist-(d-ltd)*0.005)); ltd=d; applyOrbit();
    }
    e.preventDefault();
  },{ passive:false });
  el.addEventListener('touchend', ()=>{ p3d.drag=false; });

  // Resize
  const ro = new ResizeObserver(() => {
    const nw=wrapEl.clientWidth, nh=wrapEl.clientHeight;
    if(nw>0&&nh>0){ renderer.setSize(nw,nh); camera.aspect=nw/nh; camera.updateProjectionMatrix(); }
  });
  ro.observe(wrapEl);

  // Rendu
  let animId;
  (function loop() { animId=requestAnimationFrame(loop); renderer.render(scene,camera); })();

  // Masquer loading
  if (loadEl) loadEl.style.display = 'none';
  if (infoEl)  infoEl.textContent = `${N} coupes · ${volW}×${volH}×${volD}`;

  // Stocker le slot
  p3d.slots[id] = {
    uniforms, renderer, dispose() {
      cancelAnimationFrame(animId);
      ro.disconnect();
      tex.dispose(); geo.dispose(); mat.dispose(); renderer.dispose();
    },
    setOrbit(rx, ry, d) { rotX=rx; rotY=ry; dist=d; applyOrbit(); },
  };

  _p3dCheckAllDone();
}

function _p3dCheckAllDone() {
  // Mise à jour stat footer quand tous les slots ont été traités
  const loaded  = (p3d.slots||[]).filter(Boolean).length;
  const statEl  = document.getElementById('p3dStat');
  if (!statEl) return;
  if (loaded < 4) {
    statEl.textContent = `${loaded}/4 volumes chargés…`;
  } else {
    const pat = (typeof dicomMeta!=='undefined'?dicomMeta.patientName:'')||'';
    statEl.textContent = `4/4 volumes · ${pat} · 🖱 Orbite · Shift+drag: déplacer · Scroll: zoom`;
  }
}

/* ════════════════════════════════════════════════════════════════
   RESPONSIVE MOBILE — navigation, swipe, bottom-sheet
   ════════════════════════════════════════════════════════════════ */

const _mob = {
  activeSection: 'viewer',  // viewer | worklist | panel | diag
  activePanelDot: 0,
  swipeStartX: 0, swipeStartY: 0, swipeActive: false,
};

function isMobile() { return window.innerWidth < 768; }

/* ── Nav bar mobile ── */
function mobileNav(section, btn) {
  if (!isMobile()) return;
  _mob.activeSection = section;

  // Mettre à jour les boutons
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');

  const aside       = document.querySelector('aside');
  const rightPanel  = document.querySelector('.right-panel');
  const mainEl      = document.querySelector('main');

  // Tout masquer d'abord
  if (aside)      { aside.style.display = 'none'; }
  if (rightPanel) { rightPanel.classList.remove('mobile-open'); }
  if (mainEl)     { mainEl.style.display = 'flex'; }

  if (section === 'viewer') {
    // Viewer plein écran — état par défaut
    document.getElementById('mobilePanelDots').style.display = 'flex';
  }
  else if (section === 'worklist') {
    // Ouvre la sidebar en bottom-sheet (réutilise right-panel zone)
    // Sur mobile on ouvre la worklist comme bottom-sheet sur right-panel
    rightPanel.classList.add('mobile-open');
    // S'assurer qu'on est sur l'onglet patient (worklist)
    const rpTab = document.querySelector('.rptab');
    if (rpTab) switchTab('rapport', rpTab);
    document.getElementById('mobilePanelDots').style.display = 'none';
  }
  else if (section === 'panel') {
    rightPanel.classList.add('mobile-open');
    const rpTab = document.querySelector('.rptab');
    if (rpTab) switchTab('report', rpTab);
    document.getElementById('mobilePanelDots').style.display = 'none';
  }
}

/* ── Dots navigation panneaux ── */
function buildMobileDots(count) {
  const wrap = document.getElementById('mobilePanelDots');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'mob-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => setMobileActivePanel(i));
    wrap.appendChild(d);
  }
}

function setMobileActivePanel(idx) {
  if (!isMobile()) return;
  _mob.activePanelDot = idx;
  document.querySelectorAll('.scan-panel').forEach((p, i) => {
    p.classList.toggle('mobile-active', i === idx);
  });
  document.querySelectorAll('.mob-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
  setActivePanel(idx);
}

/* ── Swipe horizontal entre panneaux ── */
function _initMobileSwipe() {
  const viewerArea = document.getElementById('viewerArea');
  if (!viewerArea) return;

  viewerArea.addEventListener('touchstart', e => {
    if (!isMobile()) return;
    if (e.touches.length !== 1) return;
    _mob.swipeStartX = e.touches[0].clientX;
    _mob.swipeStartY = e.touches[0].clientY;
    _mob.swipeActive = true;
  }, { passive: true });

  viewerArea.addEventListener('touchend', e => {
    if (!isMobile() || !_mob.swipeActive) return;
    _mob.swipeActive = false;
    const dx = e.changedTouches[0].clientX - _mob.swipeStartX;
    const dy = e.changedTouches[0].clientY - _mob.swipeStartY;
    // Swipe horizontal seulement si dx > dy et assez long
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const count = panels.length;
      if (count < 2) return;
      let next = _mob.activePanelDot + (dx < 0 ? 1 : -1);
      next = Math.max(0, Math.min(count - 1, next));
      setMobileActivePanel(next);
    }
  }, { passive: true });
}

/* ── Appliquer layout mobile après chargement DICOM ── */
function _applyMobileLayout() {
  if (!isMobile()) return;
  // Montrer le premier panneau
  document.querySelectorAll('.scan-panel').forEach((p, i) => {
    p.classList.toggle('mobile-active', i === 0);
  });
  // Construire les dots
  buildMobileDots(panels.length);
  _mob.activePanelDot = 0;
  // Badge worklist count
  const badge = document.getElementById('mnbWlBadge');
  if (badge) {
    badge.textContent = dicomSeries.length;
    badge.style.display = dicomSeries.length ? 'flex' : 'none';
  }
}

/* ── Fermer bottom-sheet en tapant hors ── */
function _initBottomSheetClose() {
  const viewerArea = document.getElementById('viewerArea');
  if (viewerArea) {
    viewerArea.addEventListener('click', () => {
      if (!isMobile()) return;
      const rp = document.querySelector('.right-panel');
      if (rp?.classList.contains('mobile-open')) {
        rp.classList.remove('mobile-open');
        // Réactiver le bouton viewer
        const mnbV = document.getElementById('mnbViewer');
        document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
        mnbV?.classList.add('active');
        _mob.activeSection = 'viewer';
        document.getElementById('mobilePanelDots').style.display = 'flex';
      }
    });
  }
}

/* ── Resize : réappliquer la logique mobile/desktop ── */
function _handleResize() {
  const mobile = isMobile();
  // Ré-afficher aside sur desktop si caché par mobile
  const aside = document.querySelector('aside');
  if (aside && !mobile) { aside.style.display = ''; }
  // Réinitialiser right-panel
  const rp = document.querySelector('.right-panel');
  if (rp && !mobile) { rp.classList.remove('mobile-open'); rp.style.height = ''; }
  // Panels : sur desktop tous visibles (position absolute → reset)
  if (!mobile) {
    document.querySelectorAll('.scan-panel').forEach(p => {
      p.classList.remove('mobile-active');
      p.style.display = '';
    });
  } else {
    _applyMobileLayout();
  }
}

/* ── Init ── */
(function initMobileResponsive() {
  // Attendre le DOM complet
  document.addEventListener('DOMContentLoaded', () => {
    _initMobileSwipe();
    _initBottomSheetClose();
    // Appliquer immédiatement si mobile
    if (isMobile()) {
      // Panneau 0 actif par défaut (avant chargement DICOM)
      buildMobileDots(0);
    }
  });

  window.addEventListener('resize', _handleResize, { passive: true });
})();

/* ── Hook dans buildViewerPanels pour mobile ── */
const _origBuildViewerPanels = typeof buildViewerPanels === 'function' ? buildViewerPanels : null;
// On patche via un observer post-build
const _mobObserver = new MutationObserver(() => {
  if (isMobile() && panels?.length) {
    _applyMobileLayout();
  }
});
if (document.getElementById('viewerArea')) {
  _mobObserver.observe(document.getElementById('viewerArea'), { childList: true });
}

/* ════════════════════════════════════════════════════════════════
   COLLAPSE COLONNES GAUCHE / DROITE
   ════════════════════════════════════════════════════════════════ */

// ResizeObserver sur le viewer-area : re-render dès que la taille change
(function initViewerResizeObserver() {
  const va = document.getElementById('viewerArea');
  if (!va || typeof ResizeObserver === 'undefined') return;
  let _resizeRafId = null;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(_resizeRafId);
    _resizeRafId = requestAnimationFrame(() => {
      if (typeof panels !== 'undefined' && panels.length) {
        panels.forEach((_, i) => {
          if (typeof renderPanelWithTransform === 'function')
            renderPanelWithTransform(i);
        });
      }
    });
  });
  ro.observe(va);
})();

function toggleSidebar(side) {
  const body = document.body;

  if (side === 'left') {
    const collapsed = body.classList.toggle('left-collapsed');
    const btn = document.getElementById('collapseLeft');
    if (btn) btn.textContent = collapsed ? '›' : '‹';
  } else {
    const collapsed = body.classList.toggle('right-collapsed');
    const btn = document.getElementById('collapseRight');
    if (btn) btn.textContent = collapsed ? '‹' : '›';
    // Resize du renderer 3D panneau après transition
    if (_panel3D.renderer) {
      setTimeout(() => {
        const wrap = document.getElementById('v3dpWrap');
        if (wrap) {
          const nw = wrap.clientWidth, nh = wrap.clientHeight;
          if (nw > 10 && nh > 10) {
            _panel3D.renderer.setSize(nw, nh);
            _panel3D.camera.aspect = nw / nh;
            _panel3D.camera.updateProjectionMatrix();
          }
        }
      }, 300);
    }
  }
}
