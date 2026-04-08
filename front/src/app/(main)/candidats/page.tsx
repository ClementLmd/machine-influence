import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getApiBaseUrl } from "@/lib/api";

type PublicUser = {
  id: string;
  role: "RECRUITER" | "INDEPENDENT";
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
  isProfileComplete: boolean;
};

async function getFeaturedCandidates(): Promise<PublicUser[]> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return [];

  const res = await fetch(`${apiBaseUrl}/users/featured`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  return (await res.json()) as PublicUser[];
}

export default async function CandidatesPage() {
  const candidates = await getFeaturedCandidates();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Talents
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Profils complets mis en avant.
        </p>
      </div>

      {candidates.length === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Aucun talent disponible pour le moment.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => {
            const name =
              `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—";
            return (
              <Link key={c.id} href={`/candidats/${c.id}`}>
                <Card className="h-full hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar src={c.profilePicture} name={name} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {name}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {c.rate ? `${c.rate} €/jour` : "Tarif non renseigné"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {c.skills?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {c.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        —
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

