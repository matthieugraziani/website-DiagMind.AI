import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Heart, 
  Building2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar
} from "lucide-react";

const SocietalImpactSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const challenges = [
    {
      icon: Users,
      title: "Population Vieillissante",
      stat: "+40%",
      description: "d'examens d'imagerie prévus d'ici 2035 due au vieillissement démographique",
      source: "Source : DREES, projections 2023",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: MapPin,
      title: "Déserts Médicaux",
      stat: "30%",
      description: "des Français vivent dans une zone sous-dotée en radiologues",
      source: "Source : DREES, Atlas de la démographie médicale 2023",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: AlertTriangle,
      title: "Pénurie de Spécialistes",
      stat: "-25%",
      description: "de radiologues en France d'ici 2030 selon les projections",
      source: "Source : Conseil National de l'Ordre des Médecins (CNOM), 2022",
      color: "from-amber-500 to-orange-500"
    }
  ];

  const solutions = [
    {
      icon: Clock,
      before: "18 min",
      after: "3 min",
      label: "Temps par cliché",
      description: "Libérez du temps pour les cas complexes",
      source: "Source : SFR (Société Française de Radiologie), 2022"
    },
    {
      icon: TrendingUp,
      before: "50",
      after: "300",
      label: "Clichés analysés/jour",
      description: "Multipliez votre capacité de diagnostique",
      source: "Source : DREES, Études sur l'activité radiologique 2023"
    },
    {
      icon: Building2,
      before: "Zones urbaines",
      after: "Partout",
      label: "Couverture territoriale",
      description: "Expertise accessible à tous les territoires"
    }
  ];

  const impacts = [
    {
      icon: Heart,
      value: "100 000+",
      label: "Patients mieux diagnostiqués par an",
      description: "Détection précoce des pathologies"
    },
    {
      icon: Users,
      value: "2 000+",
      label: "Radiologues assistés",
      description: "Charge de travail allégée"
    },
    {
      icon: MapPin,
      value: "500+",
      label: "Établissements équipés",
      description: "Y compris zones rurales"
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

  const statVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.3 + i * 0.15,
        type: "spring" as const,
        stiffness: 100,
      },
    }),
  };

  return (
    <motion.section
      ref={ref}
      id="impact"
      className="py-20 bg-muted/30"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div className="text-center space-y-4 mb-16" variants={headerVariants}>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
            <Heart className="w-4 h-4 inline mr-2" />
            Impact Sociétal
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Répondre aux Défis du{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Système de Santé Français
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Face à une demande croissante et des ressources limitées, DiagMind.AI apporte une solution concrète pour maintenir l'excellence diagnostique sur tout le territoire
          </p>
        </motion.div>

        {/* Challenges Section */}
        <motion.div className="mb-16" variants={headerVariants}>
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Les Défis Actuels
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {challenges.map((challenge, index) => {
              const Icon = challenge.icon;
              return (
                <motion.div key={index} custom={index} variants={cardVariants}>
                  <Card className="bg-background border-border hover:shadow-medical transition-all duration-300 h-full overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${challenge.color}`} />
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challenge.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-foreground mb-1">{challenge.stat}</div>
                          <h4 className="font-semibold text-foreground mb-2">{challenge.title}</h4>
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                          <p className="text-xs text-muted-foreground/70 italic mt-2">{challenge.source}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Solution Section - Before/After */}
        <motion.div className="mb-16" variants={headerVariants}>
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            La Solution DiagMind.AI
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <motion.div key={index} custom={index} variants={cardVariants}>
                  <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:shadow-medical transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{solution.label}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 py-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-muted-foreground line-through decoration-destructive/50">{solution.before}</div>
                          <span className="text-xs text-muted-foreground">Avant</span>
                        </div>
                        <ArrowRight className="w-6 h-6 text-primary" />
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{solution.after}</div>
                          <span className="text-xs text-primary">Après</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center">{solution.description}</p>
                      {solution.source && (
                        <p className="text-xs text-muted-foreground/70 italic text-center mt-2">{solution.source}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Impact Numbers */}
        <motion.div 
          className="bg-gradient-hero rounded-2xl p-8 md:p-12"
          variants={headerVariants}
        >
          <h3 className="text-xl font-semibold text-primary-foreground mb-8 text-center">
            Notre Impact Projeté à l'Horizon 2030
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {impacts.map((impact, index) => {
              const Icon = impact.icon;
              return (
                <motion.div 
                  key={index} 
                  custom={index}
                  variants={statVariants}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-4xl font-bold text-primary-foreground mb-2">{impact.value}</div>
                  <div className="text-primary-foreground font-medium mb-1">{impact.label}</div>
                  <div className="text-primary-foreground/70 text-sm">{impact.description}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          className="mt-12 text-center space-y-4"
          variants={headerVariants}
        >
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vous êtes radiologue ou directeur d'établissement ? Découvrez comment DiagMind.AI peut répondre à vos défis.
          </p>
          <a
            href="https://calendly.com/matthieu-graziani007"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-hero"
          >
            <Calendar className="h-5 w-5" />
            Discuter de Votre Projet
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default SocietalImpactSection;
