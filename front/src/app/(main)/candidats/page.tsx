import { Suspense } from "react";

import { CandidatesPageContent } from "./CandidatesPageContent";

function CandidatesPageFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Talents
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Chargement…
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<CandidatesPageFallback />}>
      <CandidatesPageContent />
    </Suspense>
  );
}
