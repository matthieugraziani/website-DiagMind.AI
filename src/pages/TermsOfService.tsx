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
  RefreshCw,
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
              Conditions régissant l'utilisation de la plateforme DiagMind.AI
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Dernière mise à jour : Janvier 2026
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
                  et l'utilisation de la plateforme DiagMind.AI, éditée par DiagMind.AI SAS.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p><strong className="text-foreground">Définitions :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>"Plateforme"</strong> : le site web et les services DiagMind.AI</li>
                    <li><strong>"Utilisateur"</strong> : toute personne accédant à la Plateforme</li>
                    <li><strong>"Professionnel de Santé"</strong> : utilisateur disposant d'un compte vérifié</li>
                    <li><strong>"Services"</strong> : l'ensemble des fonctionnalités proposées</li>
                    <li><strong>"Contenu"</strong> : données, images et résultats d'analyse</li>
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
                  Les présentes CGU ont pour objet de définir les modalités et conditions d'utilisation 
                  des services proposés par DiagMind.AI, ainsi que les droits et obligations des parties.
                </p>
                <p>
                  L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. 
                  En cas de désaccord avec l'une des stipulations, l'Utilisateur doit s'abstenir d'utiliser 
                  les Services.
                </p>
                <p>
                  DiagMind.AI se réserve le droit de modifier les présentes CGU à tout moment. Les 
                  Utilisateurs seront informés de toute modification substantielle par notification sur 
                  la Plateforme.
                </p>
              </CardContent>
            </Card>

            {/* Accès aux Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Article 3 - Accès aux Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">3.1 Conditions d'accès</h4>
                  <p>
                    L'accès aux fonctionnalités avancées de diagnostic est réservé aux professionnels 
                    de santé dûment enregistrés et vérifiés. L'inscription nécessite :
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>Un numéro RPPS valide (pour les praticiens français)</li>
                    <li>Une adresse email professionnelle</li>
                    <li>L'acceptation des présentes CGU</li>
                    <li>La validation du compte par nos équipes</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">3.2 Compte Utilisateur</h4>
                  <p>
                    L'Utilisateur est responsable de la confidentialité de ses identifiants de connexion 
                    et de toutes les activités effectuées depuis son compte. Il s'engage à notifier 
                    immédiatement DiagMind.AI de toute utilisation non autorisée.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Nature des Services */}
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-6 w-6" />
                  Article 4 - Nature et Limites des Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div className="bg-amber-100/50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    ⚠️ AVERTISSEMENT IMPORTANT
                  </p>
                  <p className="mt-2 text-amber-700 dark:text-amber-400">
                    DiagMind.AI est un outil d'aide à la décision médicale et ne se substitue EN AUCUN 
                    CAS au diagnostic d'un professionnel de santé qualifié.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Les résultats fournis sont des suggestions basées sur l'analyse algorithmique</li>
                  <li>Tout diagnostic doit être confirmé par un médecin spécialiste</li>
                  <li>L'Utilisateur reste seul responsable des décisions médicales prises</li>
                  <li>En cas d'urgence médicale, contactez immédiatement les services d'urgence</li>
                </ul>
              </CardContent>
            </Card>

            {/* Obligations de l'Utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Scale className="h-6 w-6 text-primary" />
                  Article 5 - Obligations de l'Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>L'Utilisateur s'engage à :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fournir des informations exactes et à jour lors de l'inscription</li>
                  <li>Utiliser les Services conformément à leur destination</li>
                  <li>Respecter la confidentialité des données patients traitées</li>
                  <li>Ne pas tenter de contourner les mesures de sécurité</li>
                  <li>Ne pas utiliser les Services à des fins illégales ou non autorisées</li>
                  <li>Respecter les droits de propriété intellectuelle de DiagMind.AI</li>
                  <li>Signaler tout dysfonctionnement ou utilisation abusive constaté</li>
                </ul>
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
                  <li>L'utilisation des Services sans qualification médicale appropriée pour la prise de décisions cliniques</li>
                  <li>Le partage des identifiants de connexion avec des tiers</li>
                  <li>La reproduction, modification ou distribution non autorisée des contenus</li>
                  <li>L'utilisation de robots, scripts ou outils automatisés non autorisés</li>
                  <li>Toute tentative d'accès non autorisé aux systèmes de DiagMind.AI</li>
                  <li>L'utilisation des données à des fins commerciales sans autorisation</li>
                  <li>La diffusion de contenus illicites ou contraires à l'ordre public</li>
                </ul>
                <p className="text-sm italic">
                  Tout manquement pourra entraîner la suspension ou résiliation immédiate du compte, 
                  sans préjudice des dommages et intérêts qui pourraient être réclamés.
                </p>
              </CardContent>
            </Card>

            {/* Propriété Intellectuelle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  Article 7 - Propriété Intellectuelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  L'ensemble des éléments composant la Plateforme (algorithmes, logiciels, textes, 
                  graphiques, images, logos, marques) sont la propriété exclusive de DiagMind.AI ou 
                  de ses partenaires et sont protégés par les lois françaises et internationales 
                  relatives à la propriété intellectuelle.
                </p>
                <p>
                  Toute reproduction, représentation, modification ou exploitation non autorisée de 
                  ces éléments est strictement interdite et constitue une contrefaçon sanctionnée 
                  par le Code de la propriété intellectuelle.
                </p>
                <p>
                  L'Utilisateur conserve la propriété des données qu'il soumet à la Plateforme. Il 
                  accorde à DiagMind.AI une licence limitée d'utilisation de ces données aux seules 
                  fins de fourniture des Services.
                </p>
              </CardContent>
            </Card>

            {/* Disponibilité et Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  Article 8 - Disponibilité et Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  DiagMind.AI s'efforce d'assurer la disponibilité de la Plateforme 24h/24 et 7j/7, 
                  mais ne garantit pas une disponibilité ininterrompue.
                </p>
                <p>
                  DiagMind.AI se réserve le droit de suspendre temporairement l'accès aux Services 
                  pour des opérations de maintenance, de mise à jour ou en cas de force majeure.
                </p>
                <p>
                  Les Utilisateurs seront informés dans la mesure du possible des interruptions 
                  programmées. DiagMind.AI ne pourra être tenue responsable des conséquences de 
                  ces interruptions.
                </p>
              </CardContent>
            </Card>

            {/* Responsabilité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  Article 9 - Limitation de Responsabilité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  DiagMind.AI met en œuvre tous les moyens raisonnables pour fournir des Services 
                  de qualité, mais ne saurait être tenue responsable :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Des décisions médicales prises sur la base des analyses fournies</li>
                  <li>Des dommages directs ou indirects résultant de l'utilisation des Services</li>
                  <li>Des interruptions ou dysfonctionnements indépendants de sa volonté</li>
                  <li>De la perte de données due à des circonstances échappant à son contrôle</li>
                  <li>Du contenu soumis par les Utilisateurs</li>
                </ul>
                <p>
                  La responsabilité de DiagMind.AI est limitée au montant des sommes effectivement 
                  versées par l'Utilisateur au cours des 12 derniers mois.
                </p>
              </CardContent>
            </Card>

            {/* Résiliation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Ban className="h-6 w-6 text-primary" />
                  Article 10 - Résiliation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">10.1 Résiliation par l'Utilisateur</h4>
                  <p>
                    L'Utilisateur peut résilier son compte à tout moment depuis son espace personnel 
                    ou par demande écrite à matthieu.graziani007@gmail.com.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">10.2 Résiliation par DiagMind.AI</h4>
                  <p>
                    DiagMind.AI peut suspendre ou résilier l'accès aux Services en cas de manquement 
                    aux présentes CGU, après mise en demeure restée infructueuse pendant 15 jours, 
                    sauf en cas de manquement grave justifiant une résiliation immédiate.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">10.3 Conséquences de la résiliation</h4>
                  <p>
                    La résiliation entraîne la suppression du compte et des données associées dans 
                    un délai de 30 jours, sous réserve des obligations légales de conservation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dispositions Finales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Gavel className="h-6 w-6 text-primary" />
                  Article 11 - Dispositions Finales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">11.1 Droit Applicable</h4>
                  <p>
                    Les présentes CGU sont régies par le droit français. Tout litige sera soumis 
                    à la compétence exclusive des tribunaux de Paris.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">11.2 Nullité Partielle</h4>
                  <p>
                    Si une disposition des CGU est déclarée nulle, les autres dispositions demeurent 
                    en vigueur et conservent leur plein effet.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">11.3 Contact</h4>
                  <p>
                    Pour toute question relative aux présentes CGU, contactez-nous à : 
                    <a href="mailto:legal@diagmind.ai" className="text-primary hover:underline ml-1">
                      legal@diagmind.ai
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
