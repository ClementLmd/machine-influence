import { StaticContentPage } from "@/components/layout/StaticContentPage";

export default function AboutPage() {
  return (
    <StaticContentPage
      title="À propos"
      description="Machine d'Influence connecte les talents de l'audiovisuel avec les projets qui comptent."
    >
      <p>
        Machine d&apos;Influence est une plateforme dédiée à l&apos;audiovisuel.
        Elle permet aux recruteurs de publier des missions et aux freelances de
        mettre en avant leurs compétences pour trouver des opportunités
        adaptées.
      </p>
      <p>
        Notre objectif est de simplifier la mise en relation entre les
        professionnels du secteur — acteurs, cadreurs, maquilleurs, ingénieurs
        son, monteurs et bien d&apos;autres — et les productions qui recherchent
        leurs expertises.
      </p>
    </StaticContentPage>
  );
}
