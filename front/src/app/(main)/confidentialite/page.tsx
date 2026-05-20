import { StaticContentPage } from "@/components/layout/StaticContentPage";

export default function PrivacyPage() {
  return (
    <StaticContentPage
      title="Politique de confidentialité"
      description="Comment Machine d'Influence traite vos données personnelles."
    >
      <p>
        Machine d&apos;Influence s&apos;engage à protéger les données personnelles
        des utilisateurs inscrits sur la plateforme. Les informations collectées
        servent à la gestion des comptes, des profils et des annonces.
      </p>
      <p>
        La politique de confidentialité complète sera publiée prochainement. Elle
        détaillera les finalités du traitement, la durée de conservation et vos
        droits d&apos;accès, de rectification et de suppression.
      </p>
    </StaticContentPage>
  );
}
