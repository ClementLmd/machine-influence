import Link from "next/link";
import { Suspense } from "react";

import { CandidateFilters } from "@/components/candidats/CandidateFilters";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
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
  createdAt: string;
};

type PaginatedUsers = {
  users: PublicUser[];
  total: number;
  page: number;
  limit: number;
};

async function getCandidates(options: {
  search?: string;
  skills?: string;
  minRate?: string;
  maxRate?: string;
  page: number;
}): Promise<PaginatedUsers> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return { users: [], total: 0, page: 1, limit: 12 };

  const params = new URLSearchParams({ page: String(options.page), limit: "12" });
  if (options.search?.trim()) params.set("search", options.search.trim());
  if (options.skills?.trim()) params.set("skills", options.skills.trim());
  if (options.minRate?.trim()) params.set("minRate", options.minRate.trim());
  if (options.maxRate?.trim()) params.set("maxRate", options.maxRate.trim());

  const res = await fetch(`${apiBaseUrl}/users?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return { users: [], total: 0, page: 1, limit: 12 };
  return (await res.json()) as PaginatedUsers;
}

function buildPageUrl(
  currentParams: { search?: string; skills?: string; minRate?: string; maxRate?: string },
  page: number,
) {
  const p = new URLSearchParams({ page: String(page) });
  if (currentParams.search) p.set("search", currentParams.search);
  if (currentParams.skills) p.set("skills", currentParams.skills);
  if (currentParams.minRate) p.set("minRate", currentParams.minRate);
  if (currentParams.maxRate) p.set("maxRate", currentParams.maxRate);
  return `?${p.toString()}`;
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    skills?: string;
    minRate?: string;
    maxRate?: string;
    page?: string;
  }>;
}) {
  const { search, skills, minRate, maxRate, page: pageParam } = await searchParams;
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const data = await getCandidates({ search, skills, minRate, maxRate, page });
  const totalPages = Math.ceil(data.total / data.limit);
  const filterParams = { search, skills, minRate, maxRate };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Talents
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {data.total > 0
            ? `${data.total} profil${data.total > 1 ? "s" : ""} trouvé${data.total > 1 ? "s" : ""}`
            : "Aucun profil trouvé"}
        </p>
      </div>

      <div className="mt-6">
        <Suspense>
          <CandidateFilters
            initial={{
              search: search ?? "",
              skills: skills ?? "",
              minRate: minRate ?? "",
              maxRate: maxRate ?? "",
            }}
          />
        </Suspense>
      </div>

      {data.users.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {search || skills || minRate || maxRate
              ? "Aucun profil ne correspond à ces critères. Essayez d'ajuster les filtres."
              : "Aucun talent disponible pour le moment."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.users.map((c) => {
              const name =
                `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—";
              return (
                <Link key={c.id} href={`/candidats/${c.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Avatar src={c.profilePicture} name={name} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                            {name}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                            {c.rate ? `${c.rate} €/jour` : "Tarif non renseigné"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {c.description?.trim() && (
                        <p className="mb-3 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                          {c.description}
                        </p>
                      )}
                      {c.skills?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {c.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {c.skills.length > 5 && (
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
                              +{c.skills.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Aucune compétence renseignée
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link href={buildPageUrl(filterParams, page - 1)}>
                  <Button variant="outline" size="sm">
                    ← Précédent
                  </Button>
                </Link>
              )}
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Page {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link href={buildPageUrl(filterParams, page + 1)}>
                  <Button variant="outline" size="sm">
                    Suivant →
                  </Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
