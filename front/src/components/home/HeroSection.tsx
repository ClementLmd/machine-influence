import { Button } from "@/components/ui/Button";
import { ArrowRight, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type HeroSectionProps = {
  isAuthenticated?: boolean;
};

export function HeroSection({ isAuthenticated = false }: HeroSectionProps) {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-foreground/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 lg:px-8 w-full">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Play className="size-4 text-accent fill-accent" />
            <span className="text-sm font-medium tracking-widest uppercase text-primary-foreground/70">
              La plateforme de l&apos;audiovisuel
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-primary-foreground leading-tight text-balance">
            Le talent qui donne vie à vos projets
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80 max-w-lg">
            Connectez les meilleurs freelances de l&apos;audiovisuel avec des
            projets qui comptent. Acteurs, cadreurs, maquilleurs, ingénieurs son
            et plus encore.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8"
              asChild
            >
              <Link href={isAuthenticated ? "/profile" : "/register"}>
                {isAuthenticated ? "Voir mon profil" : "S'inscrire gratuitement"}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground text-base px-8"
              asChild
            >
              <Link href="/annonces">
                {isAuthenticated ? "Voir les annonces" : "Publier un projet"}
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-primary-foreground/60 text-sm">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary-foreground font-serif">
                2 500+
              </span>
              <span>Freelances</span>
            </div>
            <div className="h-8 w-px bg-primary-foreground/20" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary-foreground font-serif">
                800+
              </span>
              <span>Projets publiés</span>
            </div>
            <div className="h-8 w-px bg-primary-foreground/20" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary-foreground font-serif">
                98%
              </span>
              <span>Satisfaction</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
