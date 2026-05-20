import { StaticContentPage } from "@/components/layout/StaticContentPage";

export default function LegalNoticePage() {
  return (
    <StaticContentPage
      title="Mentions légales"
      description="Informations légales relatives au site Machine d'Influence."
    >
      <p>
        Le site Machine d&apos;Influence est édité dans le cadre d&apos;un
        projet pédagogique. Les informations relatives à l&apos;éditeur, à
        l&apos;hébergeur et au directeur de publication seront précisées ici.
      </p>
      <p>
        Pour toute demande concernant le site ou son contenu, utilisez les
        coordonnées de contact officielles de la plateforme.
      </p>
    </StaticContentPage>
  );
}
