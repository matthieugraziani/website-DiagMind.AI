import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Watermark from "@/components/Watermark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, Mail, Cookie, Eye } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen relative">
      <Watermark />
      <div className="relative z-10">
        <Header />
        <main className="pt-24 pb-16">
          {/* Hero Section */}
          <section className="py-12 bg-gradient-to-b from-primary-light/30 to-background">
            <div className="container mx-auto px-6 text-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-6">
                <Shield className="w-4 h-4 inline mr-2" />
                Transparence
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Politique de Confidentialité
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Ce site est un site vitrine de présentation du projet DiagMind.AI. Aucune donnée personnelle n'est collectée ni traitée via ce site.
              </p>
            </div>
          </section>

          <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="space-y-8">
              {/* Nature du site */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Nature du Site</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Ce site internet est un <strong className="text-foreground">site vitrine à vocation informative</strong> présentant le projet DiagMind.AI, actuellement en phase de développement.
                  </p>
                  <p>
                    <strong className="text-foreground">DiagMind.AI n'est pas encore une société constituée.</strong> Il s'agit d'un projet porté par Matthieu Graziani. Aucun service commercial n'est proposé à ce stade.
                  </p>
                  <p>
                    Ce site ne comporte aucun formulaire de collecte de données, aucun espace membre, aucun système de paiement et aucune fonctionnalité nécessitant la saisie de données personnelles.
                  </p>
                </CardContent>
              </Card>

              {/* Données collectées */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Données Personnelles</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Aucune donnée personnelle n'est collectée</strong> via ce site. Vous pouvez le consulter librement sans fournir aucune information vous concernant.
                  </p>
                  <p>
                    En particulier, ce site ne collecte pas :
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>De noms, prénoms ou adresses email</li>
                    <li>De données de santé</li>
                    <li>De données de paiement</li>
                    <li>De données de géolocalisation</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Cookies */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Cookie className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Cookies</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Ce site peut utiliser des <strong className="text-foreground">cookies strictement nécessaires</strong> au fonctionnement technique du site (préférences d'affichage, consentement cookies).
                  </p>
                  <p>
                    Aucun cookie publicitaire, de tracking ou d'analyse comportementale n'est déposé. Vous pouvez gérer vos préférences à tout moment via le lien « Gérer les cookies » en bas de page.
                  </p>
                </CardContent>
              </Card>

              {/* Liens externes */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Liens Externes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Ce site peut contenir des liens vers des services tiers (ex. Calendly pour la prise de rendez-vous). En cliquant sur ces liens, vous quittez le site DiagMind.AI et êtes soumis à la politique de confidentialité du service tiers concerné.
                  </p>
                  <p>
                    Nous vous invitons à consulter les politiques de confidentialité de ces services avant de les utiliser.
                  </p>
                </CardContent>
              </Card>

              {/* Vos droits */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-xl">Vos Droits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Bien qu'aucune donnée personnelle ne soit collectée, conformément au RGPD (Règlement Général sur la Protection des Données), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition.
                  </p>
                  <p>
                    Vous pouvez également introduire une réclamation auprès de la <strong className="text-foreground">CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cnil.fr</a>
                  </p>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Contact</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>Pour toute question concernant cette politique de confidentialité :</p>
                  <p><strong className="text-foreground">Responsable :</strong> Matthieu Graziani</p>
                  <p><strong className="text-foreground">Email :</strong> matthieu.graziani007@gmail.com</p>
                  <p className="text-sm italic mt-4">
                    <strong className="text-foreground">Dernière mise à jour :</strong> Mars 2025
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPolicy;
