import { Brain, Mail, Linkedin, Twitter, Cookie } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

const Footer = () => {
  const { openCookieSettings } = useCookieConsent();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-hero rounded-xl">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">DiagMind.AI</h3>
                <p className="text-sm text-background/70">Diagnostic IA Médical</p>
              </div>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Révolutionnons ensemble le diagnostic médical grâce à l'intelligence artificielle de pointe.
            </p>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Solutions</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Analyse d'IRM</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Détection de Tumeurs</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Aide au Diagnostic</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Intégration PACS</a></li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Navigation</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="/#fonctionnement" className="hover:text-background transition-colors">Fonctionnement</a></li>
              <li><a href="/#avantages" className="hover:text-background transition-colors">Avantages</a></li>
              <li><a href="/neuro-irm-viewer" className="hover:text-background transition-colors">Neuro-IRM-viewer</a></li>
              <li><a href="/#contact" className="hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">Contact</h4>
            <div className="space-y-3 text-sm text-background/70">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>matthieu.graziani007@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Linkedin className="h-4 w-4" />
                <a href="https://www.linkedin.com/in/matthieu-graziani-4190b526b" target="_blank" rel="noopener noreferrer" className="hover:text-background transition-colors">LinkedIn Fondateur</a>
              </div>
              <div className="flex items-center space-x-2">
                <Twitter className="h-4 w-4" />
                <a href="#" className="hover:text-background transition-colors">@DiagMindAI</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-background/70 text-sm">
            © 2026 DiagMind.AI. Tous droits réservés.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-background/70 mt-4 md:mt-0">
            <a href="/mentions-legales" className="hover:text-background transition-colors">Mentions Légales</a>
            <a href="/politique-confidentialite" className="hover:text-background transition-colors">Politique de Confidentialité</a>
            <a href="/conditions-utilisation" className="hover:text-background transition-colors">Conditions d'Utilisation</a>
            <button 
              onClick={openCookieSettings}
              className="hover:text-background transition-colors flex items-center gap-1"
            >
              <Cookie className="h-3.5 w-3.5" />
              Gérer les cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
