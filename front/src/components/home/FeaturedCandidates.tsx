import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const candidates = [
  {
    id: 1,
    name: "Camille Durand",
    role: "Actrice",
    location: "Paris",
    rating: 4.9,
    reviews: 24,
    image: "/images/profile-1.jpg",
    tags: ["Cinéma", "Théâtre", "Doublage"],
    available: true,
  },
  {
    id: 2,
    name: "Thomas Leroy",
    role: "Cadreur / Chef opérateur",
    location: "Lyon",
    rating: 4.8,
    reviews: 31,
    image: "/images/profile-2.jpg",
    tags: ["Steadicam", "Drone", "RED"],
    available: true,
  },
  {
    id: 3,
    name: "Sophie Martin",
    role: "Maquilleuse SFX",
    location: "Paris",
    rating: 5.0,
    reviews: 18,
    image: "/images/profile-3.jpg",
    tags: ["Effets spéciaux", "Mode", "Cinéma"],
    available: false,
  },
  {
    id: 4,
    name: "Lucas Petit",
    role: "Ingénieur son",
    location: "Bordeaux",
    rating: 4.7,
    reviews: 22,
    image: "/images/profile-4.jpg",
    tags: ["Mixage", "Perche", "Post-prod"],
    available: true,
  },
];

export function FeaturedCandidates() {
  return (
    <section id="talents" className="py-24 lg:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>
            <p className="text-sm font-medium tracking-widest uppercase text-accent">
              Talents
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold font-serif tracking-tight text-foreground text-balance">
              Candidats mis en avant
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
              Des professionnels vérifiés, prêts à rejoindre votre prochaine
              production.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-accent hover:text-accent/80 hover:bg-accent/5 self-start sm:self-auto"
            asChild
          >
            <Link href="/candidats">
              Voir tous les profils
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {candidates.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/candidats/${candidate.id}`}
              className="group block bg-card rounded-xl border border-border overflow-hidden hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={candidate.image}
                  alt={`Photo de ${candidate.name}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {candidate.available && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-600 text-white border-0 text-xs">
                      Disponible
                    </Badge>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    {candidate.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm shrink-0">
                    <Star className="size-3.5 fill-accent text-accent" />
                    <span className="font-medium text-foreground">
                      {candidate.rating}
                    </span>
                    <span className="text-muted-foreground">
                      ({candidate.reviews})
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {candidate.role} · {candidate.location}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {candidate.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
