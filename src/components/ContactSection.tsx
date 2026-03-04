import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Shield, Award } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/matthieu-graziani007";

const ContactSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <motion.section
      ref={ref}
      id="contact"
      className="py-24 bg-gradient-hero relative overflow-hidden"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground">
              Réservez Votre Démonstration Gratuite
            </h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              30 minutes pour découvrir comment DiagMind.AI peut transformer votre pratique radiologique
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-6">
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <CheckCircle className="h-5 w-5" />
              <span>Présentation personnalisée</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <CheckCircle className="h-5 w-5" />
              <span>Démo sur vos cas d'usage</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <CheckCircle className="h-5 w-5" />
              <span>Sans engagement</span>
            </div>
          </motion.div>

          {/* Main CTA */}
          <motion.div variants={itemVariants}>
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-10 py-7 shadow-2xl"
              asChild
            >
              <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                <Calendar className="h-6 w-6" />
                Choisir Mon Créneau
              </a>
            </Button>
          </motion.div>

          {/* Trust signals */}
          <motion.div variants={itemVariants} className="flex justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
              <Shield className="h-4 w-4" />
              <span>RGPD Conforme</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
              <Award className="h-4 w-4" />
              <span>Marquage CE en cours</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ContactSection;
