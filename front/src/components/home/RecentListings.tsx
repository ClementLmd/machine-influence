import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const listings = [
  {
    id: 1,
    title: "Cadreur pour court-métrage",
    company: "Studio Lumière",
    location: "Paris",
    type: "Court-métrage",
    budget: "350€/jour",
    postedAt: "Il y a 2h",
    tags: ["Cadrage", "Steadicam", "4K"],
  },
  {
    id: 2,
    title: "Maquilleur·se effets spéciaux",
    company: "FX Productions",
    location: "Lyon",
    type: "Long-métrage",
    budget: "400€/jour",
    postedAt: "Il y a 5h",
    tags: ["SFX", "Prothèses", "Maquillage"],
  },
  {
    id: 3,
    title: "Acteur·rice rôle principal",
    company: "Ciné Horizon",
    location: "Marseille",
    type: "Série TV",
    budget: "Sur devis",
    postedAt: "Il y a 8h",
    tags: ["Comédie", "25-35 ans", "Bilingue"],
  },
  {
    id: 4,
    title: "Ingénieur·e son plateau",
    company: "AudioViz Studio",
    location: "Bordeaux",
    type: "Documentaire",
    budget: "300€/jour",
    postedAt: "Il y a 12h",
    tags: ["Perchiste", "Mixage", "Boom"],
  },
];

export function RecentListings() {
  return (
    <section id="listings" className="py-24 lg:py-32 bg-secondary">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>
            <p className="text-sm font-medium tracking-widest uppercase text-accent">
              Opportunités
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold font-serif tracking-tight text-foreground text-balance">
              Annonces récentes
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
              Les dernières missions publiées par des recruteurs à la
              recherche de talents comme vous.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-accent hover:text-accent/80 hover:bg-accent/5 self-start sm:self-auto"
            asChild
          >
            <Link href="/annonces">
              Voir toutes les annonces
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/annonces/${listing.id}`}
              className="group block bg-card rounded-xl border border-border p-6 hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {listing.company}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {listing.type}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {listing.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {listing.postedAt}
                </span>
                <span className="font-semibold text-foreground">
                  {listing.budget}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
