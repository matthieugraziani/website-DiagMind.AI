import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Rocket, 
  Building2, 
  Brain, 
  Globe, 
  CheckCircle2, 
  Clock,
  Target,
  Flag,
  Calendar
} from "lucide-react";

const RoadmapSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const roadmapData = [
    {
      year: "2026",
      title: "Phase Pilote",
      subtitle: "CHU pilote, Marquage CE, Validation HAS",
      icon: Target,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      quarters: [
        { q: "Q1", label: "Étude clinique CHU pilote", active: true },
        { q: "Q2", label: "Dossier Marquage CE", active: true },
        { q: "Q3", label: "Validation HAS", active: true },
        { q: "Q4", label: "Certification ISO 27001", active: true }
      ],
      milestones: ["500 patients", "Classe IIa", "10 recrutements"]
    },
    {
      year: "2027",
      title: "Déploiement National",
      subtitle: "Tous les CHU France, Remboursement Sécu",
      icon: Building2,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      quarters: [
        { q: "Q1", label: "10 premiers CHU", active: true },
        { q: "Q2", label: "Inscription LPPR", active: true },
        { q: "Q3", label: "Formation praticiens", active: true },
        { q: "Q4", label: "32 CHU opérationnels", active: true }
      ],
      milestones: ["25 recrutements", "Remboursement", "Intégration SIH"]
    },
    {
      year: "2028",
      title: "Expansion Thérapeutique",
      subtitle: "Nouvelles pathologies cérébrales",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      quarters: [
        { q: "Q1", label: "Module Parkinson", active: true },
        { q: "Q2", label: "Détection AVC", active: true },
        { q: "Q3", label: "Sclérose en plaques", active: true },
        { q: "Q4", label: "Suivi longitudinal", active: true }
      ],
      milestones: ["4 pathologies", "50 recrutements", "IA multimodale"]
    },
    {
      year: "2030",
      title: "Leader Mondial",
      subtitle: "Expansion internationale",
      icon: Globe,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      quarters: [
        { q: "Q1", label: "Europe (15 pays)", active: true },
        { q: "Q2", label: "Homologation FDA", active: true },
        { q: "Q3", label: "Asie-Pacifique", active: true },
        { q: "Q4", label: "Centre R&D Singapour", active: true }
      ],
      milestones: ["100+ recrutements", "20+ pays", "Standard mondial"]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: i * 0.15,
        ease: "easeOut" as const,
      },
    }),
  };

  const barVariants = {
    hidden: { scaleX: 0 },
    visible: (i: number) => ({
      scaleX: 1,
      transition: {
        duration: 0.8,
        delay: 0.3 + i * 0.15,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <motion.section
      ref={ref}
      id="vision"
      className="py-20 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div className="text-center space-y-4 mb-16" variants={headerVariants}>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-4">
            <Rocket className="w-4 h-4 inline mr-2" />
            Feuille de Route
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Notre Vision{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              2026-2030
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Du CHU pilote au leader mondial de l'IA diagnostique
          </p>
          <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50">
            <Clock className="w-3 h-3 mr-1" />
            Objectifs en cours de réalisation
          </Badge>
        </motion.div>

        {/* Gantt Chart */}
        <Card className="bg-background/80 backdrop-blur-sm border-border overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="grid grid-cols-12 gap-0 border-b border-border bg-muted/50">
              <div className="col-span-3 p-4 border-r border-border">
                <span className="font-semibold text-foreground">Étapes clés</span>
              </div>
              <div className="col-span-9 grid grid-cols-4">
                {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                  <div key={q} className="p-4 text-center border-r border-border last:border-r-0">
                    <span className="text-sm font-medium text-muted-foreground">{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            {roadmapData.map((phase, index) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.year}
                  custom={index}
                  variants={rowVariants}
                  className="grid grid-cols-12 gap-0 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                >
                  {/* Phase Info */}
                  <div className="col-span-3 p-4 border-r border-border">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${phase.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-primary">{phase.year}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            <Flag className="w-2.5 h-2.5 mr-0.5" />
                            À venir
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm">{phase.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{phase.subtitle}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {phase.milestones.map((m, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gantt Bars */}
                  <div className="col-span-9 grid grid-cols-4 relative">
                    {/* Background quarters */}
                    {phase.quarters.map((_, qIdx) => (
                      <div
                        key={qIdx}
                        className="p-3 border-r border-border last:border-r-0"
                      />
                    ))}

                    {/* Gantt Bar Overlay */}
                    <motion.div
                      custom={index}
                      variants={barVariants}
                      className={`absolute inset-y-3 left-2 right-2 rounded-lg ${phase.bgColor} ${phase.borderColor} border origin-left grid grid-cols-4`}
                    >
                      {phase.quarters.map((quarter, qIdx) => (
                        <div key={qIdx} className="flex items-center justify-center px-2 border-r border-border/30 last:border-r-0">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className={`w-4 h-4 ${quarter.active ? 'text-primary' : 'text-muted-foreground/30'}`} />
                            <span className="text-xs font-medium text-foreground/90 hidden lg:inline text-center">
                              {quarter.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* Legend */}
        <motion.div 
          className="flex flex-wrap justify-center gap-6 mt-8"
          variants={headerVariants}
        >
          {roadmapData.map((phase) => (
            <div key={phase.year} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded bg-gradient-to-br ${phase.color}`} />
              <span className="text-sm text-muted-foreground">{phase.year} - {phase.title}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-12 space-y-4"
          variants={headerVariants}
        >
          <p className="text-lg text-muted-foreground">Envie de faire partie de cette aventure ?</p>
          <a
            href="https://calendly.com/matthieu-graziani007"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-hero"
          >
            <Calendar className="h-5 w-5" />
            Planifier un Échange
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default RoadmapSection;
