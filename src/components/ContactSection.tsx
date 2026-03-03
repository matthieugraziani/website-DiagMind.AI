import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, Brain, CheckCircle } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/matthieu-graziani007";

const ContactSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
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
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const leftVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const rightVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        delay: 0.2,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.section 
      ref={ref}
      id="contact" 
      className="py-20 bg-gradient-to-br from-background via-primary-light/10 to-accent-light/5"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center space-y-4 mb-16"
          variants={headerVariants}
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Prêt à Révolutionner Vos{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Diagnostics ?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Contactez notre équipe d'experts pour découvrir comment DiagMind.AI peut transformer votre pratique médicale
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <motion.div variants={leftVariants}>
            <Card className="bg-background border-border shadow-medical">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <span>Réserver une Démo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Planifiez un rendez-vous directement avec notre équipe pour découvrir DiagMind.AI en action. Choisissez le créneau qui vous convient le mieux.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-trust mt-0.5" />
                    <p className="text-sm text-foreground">Présentation personnalisée de 30 minutes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-trust mt-0.5" />
                    <p className="text-sm text-foreground">Démonstration en direct sur vos cas d'usage</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-trust mt-0.5" />
                    <p className="text-sm text-foreground">Réponses à toutes vos questions techniques</p>
                  </div>
                </div>

                <Button 
                  variant="medical" 
                  size="lg" 
                  className="w-full shadow-hero"
                  asChild
                >
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-5 w-5" />
                    Prendre Rendez-vous sur Calendly
                  </a>
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Gratuit et sans engagement
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            className="space-y-8"
            variants={rightVariants}
          >
            {/* Contact Details */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Informations de Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-muted-foreground">matthieu.graziani007@gmail.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Demo CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-gradient-hero text-primary-foreground border-0">
                <CardContent className="p-8 text-center space-y-4">
                  <Brain className="h-12 w-12 mx-auto animate-pulse-soft" />
                  <h3 className="text-xl font-semibold">Démo Immédiate</h3>
                  <p className="text-primary-foreground/90">
                    Testez DiagMind.AI dès maintenant avec notre démo interactive
                  </p>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="bg-background text-primary hover:bg-background/90"
                    asChild
                  >
                    <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                      <Calendar className="h-5 w-5" />
                      Réserver un Créneau
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="bg-background border-border text-center p-4">
                <div className="text-2xl font-bold text-trust">ISO</div>
                <div className="text-sm text-muted-foreground">27001 Certifié</div>
              </Card>
              <Card className="bg-background border-border text-center p-4">
                <div className="text-2xl font-bold text-accent">RGPD</div>
                <div className="text-sm text-muted-foreground">Conforme</div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ContactSection;
