"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CandidateFilters } from "@/components/candidats/CandidateFilters";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ApiLoadState } from "@/components/ui/ApiLoadState";
import { fetchFromApi, type ApiLoadStatus } from "@/lib/api-fetch";

type PublicUser = {
  id: string;
  role: "RECRUITER" | "CANDIDATE";
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

function buildPageUrl(
  currentParams: {
    search?: string;
    skills?: string;
    minRate?: string;
    maxRate?: string;
  },
  page: number,
) {
  const p = new URLSearchParams({ page: String(page) });
  if (currentParams.search) p.set("search", currentParams.search);
  if (currentParams.skills) p.set("skills", currentParams.skills);
  if (currentParams.minRate) p.set("minRate", currentParams.minRate);
  if (currentParams.maxRate) p.set("maxRate", currentParams.maxRate);
  return `?${p.toString()}`;
}

function CandidateCardSkeleton() {
  return (
    <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
  );
}

export function CandidatesPageContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? undefined;
  const skills = searchParams.get("skills") ?? undefined;
  const minRate = searchParams.get("minRate") ?? undefined;
  const maxRate = searchParams.get("maxRate") ?? undefined;
  const pageParam = searchParams.get("page");
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const [data, setData] = useState<PaginatedUsers>({
    users: [],
    total: 0,
    page: 1,
    limit: 12,
  });
  const [status, setStatus] = useState<ApiLoadStatus>("loading");
  const [retryCount, setRetryCount] = useState(0);

  const filterParams = { search, skills, minRate, maxRate };
  const totalPages = Math.ceil(data.total / data.limit);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");

      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (search?.trim()) params.set("search", search.trim());
      if (skills?.trim()) params.set("skills", skills.trim());
      if (minRate?.trim()) params.set("minRate", minRate.trim());
      if (maxRate?.trim()) params.set("maxRate", maxRate.trim());

      const result = await fetchFromApi<PaginatedUsers>(
        `/users?${params.toString()}`,
      );
      if (cancelled) return;

      if (result.status === "success") {
        setData(result.data);
        setStatus("success");
        return;
      }

      setData({ users: [], total: 0, page: 1, limit: 12 });
      setStatus(result.status === "not-found" ? "error" : result.status);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [search, skills, minRate, maxRate, page, retryCount]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Talents
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {status === "loading"
            ? "Chargement des données…"
            : status === "success" && data.total > 0
              ? `${data.total} profil${data.total > 1 ? "s" : ""} trouvé${data.total > 1 ? "s" : ""}`
              : status === "success"
                ? "Aucun profil trouvé"
                : null}
        </p>
      </div>

      <div className="mt-6">
        <CandidateFilters
          initial={{
            search: search ?? "",
            skills: skills ?? "",
            minRate: minRate ?? "",
            maxRate: maxRate ?? "",
          }}
        />
      </div>

      {status === "loading" ? (
        <>
          <ApiLoadState status="loading" className="mt-6" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CandidateCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : status === "error" || status === "unconfigured" ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-8">
          <ApiLoadState
            status={status}
            onRetry={() => setRetryCount((n) => n + 1)}
          />
        </div>
      ) : data.users.length === 0 ? (
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
