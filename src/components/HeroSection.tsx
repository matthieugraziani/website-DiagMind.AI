import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, Shield, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-brain-scan.jpg";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  // Parallax effect for the hero image
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  
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

  const itemVariants = {
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95, x: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section ref={sectionRef} id="accueil" className="pt-24 pb-16 bg-gradient-to-br from-background via-primary-light/20 to-accent-light/10 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ y: contentY }}
          >
            <div className="space-y-4">
              <motion.div variants={itemVariants}>
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                  🧠 Intelligence Artificielle Médicale
                </Badge>
              </motion.div>
              
              <motion.h1 
                variants={itemVariants}
                className="text-4xl lg:text-6xl font-bold text-foreground leading-tight"
              >
                Révolutionnez le{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  diagnostic
                </span>{" "}
                des tumeurs cérébrales
              </motion.h1>
              
              <motion.p 
                variants={itemVariants}
                className="text-xl text-muted-foreground leading-relaxed max-w-lg"
              >
                DiagMind.AI utilise l'intelligence artificielle de pointe pour analyser les images médicales cérébrales avec une précision exceptionnelle, aidant les radiologues à détecter plus rapidement les anomalies.
              </motion.p>
            </div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-3 gap-6"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">18→3 min</div>
                <div className="text-sm text-muted-foreground">Par cliché</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">6x</div>
                <div className="text-sm text-muted-foreground">Plus rapide</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">Précision</div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                variant="medical" 
                size="lg" 
                className="shadow-hero text-lg px-8 py-6"
                asChild
              >
                <a href="https://calendly.com/matthieu-graziani007" target="_blank" rel="noopener noreferrer">
                  <Calendar className="h-5 w-5" />
                  Réserver une Démo Gratuite
                </a>
              </Button>
            </motion.div>
            <motion.p variants={itemVariants} className="text-sm text-muted-foreground">
              ✓ 30 min · ✓ Sans engagement · ✓ Présentation personnalisée
            </motion.p>

            {/* Trust Indicators */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center space-x-6 pt-4"
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-trust" />
                <span className="text-sm text-muted-foreground">Certifié Médical</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-accent" />
                <span className="text-sm text-muted-foreground">IA de Pointe</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Précision Clinique</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Image with Parallax */}
          <motion.div 
            className="relative"
            variants={imageVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="relative overflow-hidden rounded-2xl shadow-hero"
              style={{ y: imageY, scale: imageScale }}
            >
              <img
                src={heroImage}
                alt="Analyse d'imagerie cérébrale par IA"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </motion.div>
            
            {/* Floating Stats Cards */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-background p-4 rounded-xl shadow-medical border border-border"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">AI</div>
                <div className="text-xs text-muted-foreground">Analyse Active</div>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-4 -left-4 bg-background p-4 rounded-xl shadow-medical border border-border"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-trust">✓</div>
                <div className="text-xs text-muted-foreground">Détection</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
