import { UserPlus, Search, Handshake } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Créez votre profil",
    description:
      "Inscrivez-vous et mettez en avant vos compétences, votre expérience et votre portfolio. Que vous soyez acteur, cadreur ou maquilleur.",
  },
  {
    number: "02",
    icon: Search,
    title: "Trouvez des missions",
    description:
      "Parcourez les annonces qui correspondent à vos compétences ou publiez votre projet et laissez les talents venir à vous.",
  },
  {
    number: "03",
    icon: Handshake,
    title: "Collaborez",
    description:
      "Échangez directement, négociez les conditions et lancez votre collaboration en toute confiance grâce aux avis vérifiés.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 lg:py-32 bg-background"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium tracking-widest uppercase text-accent">
            Simple et efficace
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold font-serif tracking-tight text-foreground text-balance">
            Comment ça marche
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Trois étapes pour trouver votre prochaine mission ou le talent idéal
            pour votre projet.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="group relative">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl font-bold font-serif text-border group-hover:text-accent/30 transition-colors">
                  {step.number}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10">
                  <step.icon className="size-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold font-serif text-foreground">
                  {step.title}
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
