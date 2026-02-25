'use client';

import Link from 'next/link';

type NavbarProps = {
  user?: { email: string } | null;
};

export function Navbar({ user = null }: NavbarProps) {
  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-semibold text-neutral-900 dark:text-white"
        >
          Machine d&apos;Influence
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/annonces"
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Annonces
          </Link>
          <Link
            href="/candidats"
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Candidats
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Mon profil
              </Link>
              <Link
                href="/discussion"
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Messages
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
