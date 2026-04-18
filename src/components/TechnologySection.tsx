import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Database, Microscope, Layers, Workflow } from "lucide-react";
import aiBackground from "@/assets/ai-medical-bg.jpg";
import { RGPDBadge, ISO27001Badge, CEBadgeSimple } from "@/components/CertificationBadges";

const TechnologySection = () => {
  const ref = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  // Parallax effect for background
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const bgY = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.2, 1.1]);

  const technologies = [
    {
      icon: Cpu,
      title: "Deep Learning Avancé",
      description: "Réseaux de neurones convolutionnels spécialisés dans l'analyse d'imagerie médicale",
      technologies: ["TensorFlow", "PyTorch", "CUDA"]
    },
    {
      icon: Database,
      title: "Big Data Médical",
      description: "Entraînement sur des millions d'images médicales annotées par des experts",
      technologies: ["Cloud Computing", "Data Pipeline", "MLOps"]
    },
    {
      icon: Microscope,
      title: "Vision par Ordinateur",
      description: "Détection automatique des anomalies avec segmentation précise des régions d'intérêt",
      technologies: ["Computer Vision", "Segmentation", "Feature Detection"]
    },
    {
      icon: Layers,
      title: "Architectures Multi-échelles",
      description: "Analyse simultanée à différentes résolutions pour une détection optimale",
      technologies: ["Multi-Scale CNN", "Attention Mechanisms", "Ensemble Methods"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: i * 0.1,
        ease: "easeOut" as const,
      },
    }),
  };

  const certCardVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: 0.4 + i * 0.15,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <motion.section 
      ref={ref}
      id="technologie" 
      className="py-20 bg-muted/20 relative overflow-hidden"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Background Image with Parallax */}
      <motion.div 
        ref={bgRef}
        className="absolute inset-0 opacity-5"
        style={{ y: bgY, scale: bgScale }}
      >
        <img
          src={aiBackground}
          alt="AI Technology Background"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center space-y-4 mb-16"
          variants={headerVariants}
        >
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-4">
            🔬 Technologie de Pointe
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            L'Intelligence Artificielle au{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Service du Diagnostic
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Notre plateforme combine les dernières avancées en intelligence artificielle et vision par ordinateur pour offrir une précision diagnostique exceptionnelle
          </p>
        </motion.div>

        {/* Technology Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {technologies.map((tech, index) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={index}
                custom={index}
                variants={cardVariants}
              >
                <Card className="bg-background/80 backdrop-blur-sm border-border hover:shadow-medical transition-all duration-300 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-accent-light rounded-xl flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {tech.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {tech.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tech.technologies.map((techName, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs">
                          {techName}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Technical Specifications */}
        <motion.div variants={headerVariants}>
          <Card className="bg-gradient-to-r from-background to-primary-light/10 border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center space-x-2">
                <Workflow className="h-6 w-6 text-primary" />
                <span>Spécifications Techniques</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">95.2%</div>
                  <div className="text-sm text-muted-foreground">Sensibilité</div>
                  <div className="text-xs text-muted-foreground">Détection des anomalies</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">97.8%</div>
                  <div className="text-sm text-muted-foreground">Spécificité</div>
                  <div className="text-xs text-muted-foreground">Réduction des faux positifs</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">&lt; 30s</div>
                  <div className="text-sm text-muted-foreground">Temps de traitement</div>
                  <div className="text-xs text-muted-foreground">Par image haute résolution</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security & Compliance - Detailed Cards */}
        <div className="mt-16 space-y-8">
          <motion.div 
            className="text-center mb-8"
            variants={headerVariants}
          >
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Conformité & Certifications
            </h3>
            <p className="text-muted-foreground">
              Notre plateforme vise les normes les plus strictes en matière de sécurité et de protection des données médicales
            </p>
            <Badge variant="outline" className="mt-3 text-amber-600 border-amber-400 bg-amber-50">
              🎯 Certifications en cours d'obtention
            </Badge>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* RGPD Card */}
            <motion.div
              custom={0}
              variants={certCardVariants}
            >
              <Card className="group bg-background/80 backdrop-blur-sm border-border hover:shadow-medical transition-all duration-300 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <RGPDBadge className="w-14 h-14 flex-shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">RGPD</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1 text-amber-600 border-amber-400">Objectif 2026</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    Le <strong>Règlement Général sur la Protection des Données</strong> garantira la protection des données personnelles de santé de nos utilisateurs.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Consentement explicite pour le traitement des données</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Droit à l'effacement et à la portabilité</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Anonymisation des données d'analyse</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Hébergement en Europe (HDS agréé)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* ISO 27001 Card */}
            <motion.div
              custom={1}
              variants={certCardVariants}
            >
              <Card className="group bg-background/80 backdrop-blur-sm border-border hover:shadow-medical transition-all duration-300 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <ISO27001Badge className="w-14 h-14 flex-shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">ISO 27001</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1 text-amber-600 border-amber-400">Objectif 2026</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    La certification <strong>ISO 27001</strong> attestera de notre système de management de la sécurité de l'information (SMSI) conforme aux standards internationaux.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Gestion des risques de sécurité</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Chiffrement AES-256 bout en bout</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Audits de sécurité réguliers</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Plan de continuité d'activité</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* CE Marking Card */}
            <motion.div
              custom={2}
              variants={certCardVariants}
            >
              <Card className="group bg-background/80 backdrop-blur-sm border-border hover:shadow-medical transition-all duration-300 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <CEBadgeSimple className="w-14 h-14 flex-shrink-0 transition-transform duration-500 group-hover:rotate-[360deg]" />
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">Marquage CE</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1 text-amber-600 border-amber-400">Objectif 2026</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    Le <strong>marquage CE</strong> certifiera que notre logiciel est conforme aux exigences de la réglementation européenne sur les dispositifs médicaux (MDR 2017/745).
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Classification comme dispositif médical de classe IIa</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Évaluation clinique documentée</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Surveillance post-commercialisation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-trust mt-0.5">✓</span>
                      <span>Organisme notifié européen</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default TechnologySection;
