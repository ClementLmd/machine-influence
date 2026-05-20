import { StaticContentPage } from "@/components/layout/StaticContentPage";

export default function ContactPage() {
  return (
    <StaticContentPage
      title="Contact"
      description="Une question sur Machine d'Influence ? Écrivez-nous."
    >
      <p>
        Pour toute demande concernant la plateforme, votre compte ou une
        annonce, un canal de contact sera bientôt disponible.
      </p>
      <p>
        En attendant, vous pouvez utiliser les fonctionnalités de la plateforme
        (profil, annonces) pour gérer vos échanges au sein du service.
      </p>
    </StaticContentPage>
  );
}
