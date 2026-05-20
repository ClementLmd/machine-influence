"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Clapperboard, LogOut, Menu, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUnreadCount } from "@/contexts/UnreadCountContext";
import type { User } from "@supabase/supabase-js";

export function HomeNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { unreadCount } = useUnreadCount();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleTitleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const displayName = user?.user_metadata?.firstName
    ?? user?.email?.split('@')[0]
    ?? 'Mon compte';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={handleTitleClick}
        >
          <Clapperboard className="size-7 text-accent" />
          <span className="text-xl font-bold font-serif tracking-tight text-foreground">
            Machine d&apos;Influence
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Comment ça marche
          </Link>
          <Link
            href="/annonces"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Annonces
          </Link>
          <Link
            href="/candidats"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Talents
          </Link>
          {user && (
            <Link
              href="/messages"
              className="relative text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <MessageCircle className="size-4" />
              Messages
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-red-600 text-white px-1.5 py-0 text-xs min-w-[1.25rem] h-5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {displayName}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" />
                Se déconnecter
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                asChild
              >
                <Link href="/register">S&apos;inscrire</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileMenuOpen ? (
            <X className="size-6" />
          ) : (
            <Menu className="size-6" />
          )}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4">
          <div className="flex flex-col gap-4">
            <Link
              href="/#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comment ça marche
            </Link>
            {user && (
              <Link
                href="/messages"
                className="relative text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageCircle className="size-4" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="bg-red-600 text-white px-1.5 py-0 text-xs min-w-[1.25rem] h-5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Link>
            )}
            <Link
              href="/annonces"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Annonces
            </Link>
            <Link
              href="/candidats"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Talents
            </Link>
          </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="px-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {displayName}
                  </Link>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="justify-start" asChild>
                    <Link href="/login">Se connecter</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    asChild
                  >
                    <Link href="/register">S&apos;inscrire</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
      )}
    </header>
  );
}
