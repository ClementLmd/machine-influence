import { Clapperboard } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  plateforme: [
    { label: "Trouver un freelance", href: "/candidats" },
    { label: "Trouver une mission", href: "/annonces" },
    { label: "Publier un projet", href: "/annonces" },
    { label: "Tarifs", href: "#" },
  ],
  metiers: [
    { label: "Acteurs", href: "/candidats?metier=acteur" },
    { label: "Cadreurs", href: "/candidats?metier=cadreur" },
    { label: "Maquilleurs", href: "/candidats?metier=maquilleur" },
    { label: "Ingénieurs son", href: "/candidats?metier=son" },
    { label: "Monteurs", href: "/candidats?metier=monteur" },
  ],
  entreprise: [
    { label: "À propos", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Presse", href: "#" },
  ],
  legal: [
    { label: "CGU", href: "#" },
    { label: "Politique de confidentialité", href: "#" },
    { label: "Mentions légales", href: "#" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Clapperboard className="size-6 text-accent" />
              <span className="text-lg font-bold font-serif tracking-tight">
                Machine d&apos;Influence
              </span>
            </Link>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              La plateforme qui connecte les talents de l&apos;audiovisuel avec
              les projets qui comptent.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 tracking-wide uppercase text-primary-foreground/40">
              Plateforme
            </h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.plateforme.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 tracking-wide uppercase text-primary-foreground/40">
              Métiers
            </h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.metiers.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 tracking-wide uppercase text-primary-foreground/40">
              Entreprise
            </h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.entreprise.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 tracking-wide uppercase text-primary-foreground/40">
              Légal
            </h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} Machine d&apos;Influence. Tous droits
            réservés.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-xs text-primary-foreground/40 hover:text-primary-foreground transition-colors"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-xs text-primary-foreground/40 hover:text-primary-foreground transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-xs text-primary-foreground/40 hover:text-primary-foreground transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
