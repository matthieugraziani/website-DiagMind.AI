import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Watermark from "@/components/Watermark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, Building2, Server, Mail, FileText } from "lucide-react";

const LegalNotice = () => {
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
                <Scale className="w-4 h-4 inline mr-2" />
                Informations Légales
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Mentions Légales
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Conformément aux dispositions des articles 6-III et 19 de la Loi n°2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique.
              </p>
            </div>
          </section>

          <div className="container mx-auto px-6 py-12 max-w-4xl">
            <div className="space-y-8">
              {/* Éditeur du site */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Éditeur du Site</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Ce site est édité par <strong className="text-foreground">Matthieu Graziani</strong>, personne physique, dans le cadre de la présentation du projet DiagMind.AI.
                  </p>
                  <p>
                    <strong className="text-foreground">Statut :</strong> Projet en cours de développement — aucune structure juridique n'est encore constituée à ce jour.
                  </p>
                  <p><strong className="text-foreground">Directeur de la publication :</strong> Matthieu Graziani</p>
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
                  <p><strong className="text-foreground">Email :</strong> matthieu.graziani007@gmail.com</p>
                </CardContent>
              </Card>

              {/* Hébergement */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Server className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Hébergement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p><strong className="text-foreground">Hébergeur :</strong> Lovable (via Supabase / infrastructure cloud)</p>
                  <p className="text-sm">
                    Ce site vitrine est hébergé sur une infrastructure cloud. Aucune donnée personnelle ni donnée de santé n'est stockée ou traitée via ce site.
                  </p>
                </CardContent>
              </Card>

              {/* Propriété intellectuelle */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Propriété Intellectuelle</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    L'ensemble du contenu de ce site (textes, images, logos, maquettes, etc.) est la propriété de Matthieu Graziani ou utilisé avec autorisation, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
                  </p>
                  <p>
                    Toute reproduction ou exploitation non autorisée du contenu de ce site est interdite.
                  </p>
                  <p>
                    <strong className="text-foreground">Note :</strong> La marque DiagMind.AI n'est pas encore déposée. Le nom est utilisé à titre de projet.
                  </p>
                </CardContent>
              </Card>

              {/* Nature du projet */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-accent-light rounded-lg flex items-center justify-center">
                      <Scale className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Nature du Projet</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    DiagMind.AI est un <strong className="text-foreground">projet en phase de développement</strong>. Aucun service commercial n'est proposé à ce stade. Les informations présentées sur ce site décrivent la vision et les objectifs du projet.
                  </p>
                  <p>
                    Aucun dispositif médical n'est commercialisé ni certifié à ce jour. Les certifications et marquages mentionnés sur le site correspondent à des objectifs visés dans le cadre du développement futur du projet.
                  </p>
                </CardContent>
              </Card>

              {/* Limitation de responsabilité */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-xl">Limitation de Responsabilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Les informations présentées sur ce site sont fournies à titre indicatif et ne constituent ni une offre commerciale, ni un conseil médical, ni une promesse de résultats.
                  </p>
                  <p>
                    L'éditeur ne saurait être tenu responsable de l'utilisation ou de l'interprétation des informations contenues sur ce site.
                  </p>
                </CardContent>
              </Card>

              {/* Droit applicable */}
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-xl">Droit Applicable</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                  <p>
                    Les présentes mentions légales sont régies par le droit français.
                  </p>
                  <p>
                    <strong className="text-foreground">Dernière mise à jour :</strong> Mars 2026
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

export default LegalNotice;
