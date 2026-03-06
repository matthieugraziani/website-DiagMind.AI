import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Watermark from "@/components/Watermark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Users, 
  Shield, 
  AlertTriangle, 
  Scale, 
  Ban, 
  Gavel
} from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Watermark />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              <Scale className="h-3 w-3 mr-1" />
              Document Juridique
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-xl text-muted-foreground">
              Conditions régissant l'utilisation du site vitrine DiagMind.AI
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Dernière mise à jour : Mars 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Préambule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  Article 1 - Préambule et Définitions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'accès 
                  et l'utilisation du site vitrine DiagMind.AI, projet personnel porté par Matthieu Graziani.
                </p>
                <p>
                  DiagMind.AI est un projet en cours de développement. Il ne constitue pas une entité 
                  juridique immatriculée et ne propose actuellement aucun service commercial ni dispositif 
                  médical certifié.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><strong className="text-foreground">Définitions :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>"Site"</strong> : le site vitrine DiagMind.AI accessible à l'adresse diagmind-ai.lovable.app</li>
                    <li><strong>"Visiteur"</strong> : toute personne accédant au Site</li>
                    <li><strong>"Contenu"</strong> : l'ensemble des textes, images, vidéos et éléments présents sur le Site</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Objet et Acceptation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  Article 2 - Objet et Acceptation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Les présentes CGU ont pour objet de définir les conditions d'accès et de consultation 
                  du site vitrine DiagMind.AI.
                </p>
                <p>
                  Le Site est un site vitrine à vocation informative et de présentation du projet 
                  DiagMind.AI. Il ne propose aucune inscription, création de compte, ni espace membre.
                </p>
                <p>
                  La simple navigation sur le Site implique l'acceptation pleine et entière des 
                  présentes CGU. En cas de désaccord, le Visiteur doit quitter le Site.
                </p>
              </CardContent>
            </Card>

            {/* Accès au Site */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Article 3 - Accès au Site
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Le Site est accessible gratuitement à tout Visiteur disposant d'un accès à Internet. 
                  Aucune inscription ni authentification n'est requise pour consulter le Site.
                </p>
                <p>
                  Matthieu Graziani s'efforce de maintenir le Site accessible, mais ne garantit pas 
                  une disponibilité ininterrompue. Le Site peut être temporairement indisponible pour 
                  des raisons de maintenance ou de mise à jour.
                </p>
              </CardContent>
            </Card>

            {/* Avertissement */}
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-6 w-6" />
                  Article 4 - Avertissement Important
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div className="bg-amber-100/50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    ⚠️ AVERTISSEMENT
                  </p>
                  <p className="mt-2 text-amber-700 dark:text-amber-400">
                    DiagMind.AI est un projet en cours de développement. Aucun dispositif médical n'est 
                    actuellement certifié ni commercialisé. Les informations présentées sur ce site sont 
                    fournies à titre informatif et ne constituent en aucun cas un avis médical.
                  </p>
                </div>
                <p>
                  Le contenu du Site ne se substitue en aucun cas au diagnostic ou à l'avis d'un 
                  professionnel de santé qualifié. En cas d'urgence médicale, contactez immédiatement 
                  les services d'urgence (15 / 112).
                </p>
              </CardContent>
            </Card>

            {/* Propriété Intellectuelle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Scale className="h-6 w-6 text-primary" />
                  Article 5 - Propriété Intellectuelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  L'ensemble des éléments composant le Site (textes, graphiques, images, logos, 
                  mises en page, vidéos) sont la propriété de Matthieu Graziani ou font l'objet 
                  d'une autorisation d'utilisation.
                </p>
                <p>
                  Toute reproduction, représentation, modification ou exploitation non autorisée de 
                  ces éléments est strictement interdite et constitue une contrefaçon sanctionnée 
                  par le Code de la propriété intellectuelle.
                </p>
              </CardContent>
            </Card>

            {/* Comportements Interdits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Ban className="h-6 w-6 text-destructive" />
                  Article 6 - Comportements Interdits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Sont strictement interdits :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>La reproduction ou distribution non autorisée du contenu du Site</li>
                  <li>L'utilisation de robots, scripts ou outils automatisés pour collecter des données du Site</li>
                  <li>Toute tentative d'accès non autorisé aux systèmes du Site</li>
                  <li>La diffusion de contenus illicites ou contraires à l'ordre public en lien avec le Site</li>
                  <li>Toute utilisation du nom ou de la marque DiagMind.AI sans autorisation préalable</li>
                </ul>
              </CardContent>
            </Card>

            {/* Limitation de Responsabilité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Article 7 - Limitation de Responsabilité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Les informations présentées sur le Site sont fournies à titre indicatif et informatif. 
                  Matthieu Graziani ne saurait être tenu responsable :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Des éventuelles inexactitudes ou omissions dans le contenu du Site</li>
                  <li>Des dommages directs ou indirects résultant de la consultation du Site</li>
                  <li>Des interruptions ou dysfonctionnements du Site</li>
                  <li>Du contenu des sites tiers accessibles via des liens hypertextes</li>
                </ul>
              </CardContent>
            </Card>

            {/* Dispositions Finales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Gavel className="h-6 w-6 text-primary" />
                  Article 8 - Dispositions Finales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">8.1 Droit Applicable</h4>
                  <p>
                    Les présentes CGU sont régies par le droit français. Tout litige relatif à 
                    l'interprétation ou l'exécution des présentes sera soumis à la compétence 
                    des tribunaux français compétents.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">8.2 Modification des CGU</h4>
                  <p>
                    Les présentes CGU peuvent être modifiées à tout moment. La date de dernière 
                    mise à jour est indiquée en haut de cette page. La poursuite de la navigation 
                    après modification vaut acceptation des nouvelles CGU.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">8.3 Nullité Partielle</h4>
                  <p>
                    Si une disposition des CGU est déclarée nulle, les autres dispositions demeurent 
                    en vigueur et conservent leur plein effet.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">8.4 Contact</h4>
                  <p>
                    Pour toute question relative aux présentes CGU, contactez : 
                    <a href="mailto:matthieu.graziani007@gmail.com" className="text-primary hover:underline ml-1">
                      matthieu.graziani007@gmail.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;
