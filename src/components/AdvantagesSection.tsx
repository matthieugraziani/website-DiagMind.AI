import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Clock, TrendingUp, Users, Award, Brain, Stethoscope, Building2, GraduationCap, FileCheck, HeartPulse } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/matthieu-graziani007";

const AdvantagesSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const proofPoints = [
    {
      icon: Brain,
      title: "Technologie Deep Learning",
      description: "Réseaux de neurones convolutifs (CNN) entraînés sur plus de 100 000 images médicales annotées par des radiologues certifiés.",
      stat: "100K+",
      statLabel: "images d'entraînement",
      color: "text-primary"
    },
    {
      icon: Zap,
      title: "Gain de Temps Clinique",
      description: "Réduction du temps d'analyse de 18 à 3 minutes par cliché, permettant aux radiologues de traiter 6 fois plus de patients.",
      stat: "6x",
      statLabel: "plus de patients",
      color: "text-accent"
    },
    {
      icon: Stethoscope,
      title: "Aide au Diagnostic",
      description: "Outil d'aide à la décision qui assiste le radiologue sans le remplacer, conformément aux recommandations de la HAS.",
      stat: "95%",
      statLabel: "de précision",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Conformité Réglementaire",
      description: "Démarche de conformité RGPD, hébergement HDS en cours, et processus de marquage CE dispositif médical engagé.",
      stat: "RGPD",
      statLabel: "en conformité",
      color: "text-trust"
    },
    {
      icon: Building2,
      title: "Intégration PACS/RIS",
      description: "Compatible avec les systèmes PACS et RIS existants via protocoles DICOM et HL7 FHIR, sans perturber votre workflow.",
      stat: "DICOM",
      statLabel: "compatible",
      color: "text-accent"
    },
    {
      icon: HeartPulse,
      title: "Impact Territorial",
      description: "Solution conçue pour répondre à la désertification médicale et à l'augmentation des examens liée au vieillissement démographique.",
      stat: "30%",
      statLabel: "de radiologues manquants d'ici 2030",
      color: "text-primary"
    }
  ];

  const trustedBy = [
    { label: "Incubateur santé", detail: "Programme d'accompagnement" },
    { label: "Recherche clinique", detail: "Partenariats hospitaliers en cours" },
    { label: "IA responsable", detail: "Charte éthique signée" },
    { label: "Open Innovation", detail: "Collaboration avec des CHU" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
    }),
  };

  return (
    <motion.section
      ref={ref}
      id="avantages"
      className="py-20 bg-background"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <div className="container mx-auto px-6">
        {/* Header SEO-optimisé */}
        <motion.div className="text-center space-y-4 mb-16" variants={headerVariants}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium">
            Solution IA certifiée pour la radiologie
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            L'Intelligence Artificielle au Service du{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Diagnostic Médical
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            DiagMind.AI développe une solution d'aide au diagnostic radiologique basée sur le deep learning,
            conçue pour accélérer l'interprétation des images médicales tout en renforçant la précision clinique.
          </p>
        </motion.div>

        {/* Cartes de preuves */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {proofPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div key={index} custom={index} variants={cardVariants}>
                <Card className="group bg-card-gradient border-border hover:shadow-medical transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-light to-accent-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className={`h-6 w-6 ${point.color}`} />
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${point.color}`}>{point.stat}</div>
                        <div className="text-xs text-muted-foreground">{point.statLabel}</div>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {point.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {point.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>


        {/* CTA SEO */}
        <motion.div
          className="mt-16 bg-gradient-hero rounded-2xl p-10 text-center space-y-4"
          variants={headerVariants}
        >
          <h3 className="text-2xl font-bold text-primary-foreground">
            Prêt à transformer votre pratique radiologique ?
          </h3>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Découvrez comment DiagMind.AI peut réduire vos temps d'analyse et améliorer la prise en charge de vos patients.
          </p>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-3 rounded-lg bg-primary-foreground text-primary font-semibold hover:bg-primary-foreground/90 transition-colors"
          >
            Réserver une Démonstration
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default AdvantagesSection;
