import { Button } from "@/components/ui/button";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-hero rounded-xl shadow-medical">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DiagMind.AI</h1>
              <p className="text-xs text-muted-foreground">Diagnostic IA Médical</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/#accueil" className="text-foreground hover:text-primary transition-colors">
              Accueil
            </a>
            <a href="/#fonctionnement" className="text-foreground hover:text-primary transition-colors">
              Fonctionnement
            </a>
            <a href="/#avantages" className="text-foreground hover:text-primary transition-colors">
              Avantages
            </a>
            <a href="/#vision" className="text-foreground hover:text-primary transition-colors">
              Vision
            </a>
            <a href="/#contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="medical" size="sm" asChild>
              <a href="https://calendly.com/matthieu-graziani007" target="_blank" rel="noopener noreferrer">Réserver une Démo</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col space-y-4 pt-4">
              <a href="/#accueil" className="text-foreground hover:text-primary transition-colors">
                Accueil
              </a>
              <a href="/#fonctionnement" className="text-foreground hover:text-primary transition-colors">
                Fonctionnement
              </a>
              <a href="/#avantages" className="text-foreground hover:text-primary transition-colors">
                Avantages
              </a>
              <a href="/#vision" className="text-foreground hover:text-primary transition-colors">
                Vision
              </a>
              <a href="/#contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="medical" size="sm" asChild>
                  <a href="https://calendly.com/matthieu-graziani007" target="_blank" rel="noopener noreferrer">Réserver une Démo</a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;