import { Suspense } from "react";

import { AnnouncementsPageContent } from "./AnnouncementsPageContent";

function AnnouncementsPageFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground font-serif">
          Annonces
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Découvrez les opportunités publiées par les recruteurs.
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <Suspense fallback={<AnnouncementsPageFallback />}>
      <AnnouncementsPageContent />
    </Suspense>
  );
}
