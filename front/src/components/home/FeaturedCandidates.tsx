"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ApiLoadState } from "@/components/ui/ApiLoadState";
import { fetchFromApi, type ApiFetchResult, type ApiLoadStatus } from "@/lib/api-fetch";
import { getApiBaseUrl } from "@/lib/api";

type FeaturedProfile = {
  id: string;
  role: "RECRUITER" | "CANDIDATE";
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
  isProfileComplete: boolean;
};

const FEATURED_PROFILE_KEYS = (
  process.env.NEXT_PUBLIC_FEATURED_PROFILE_KEYS ?? ""
)
  .split(",")
  .map((key) => key.trim())
  .filter(Boolean);

function fullName(profile: FeaturedProfile) {
  return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeaturedProfiles(): Promise<
  ApiFetchResult<FeaturedProfile[]>
> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return { status: "unconfigured" };

  try {
    if (FEATURED_PROFILE_KEYS.length) {
      const byId = await Promise.all(
        FEATURED_PROFILE_KEYS.map(async (key) => {
          const result = await fetchFromApi<FeaturedProfile>(
            `/users/${encodeURIComponent(key)}`,
          );
          if (result.status !== "success") return null;
          return result.data;
        }),
      );

      const profilesById = byId.filter((profile): profile is FeaturedProfile => {
        return (
          !!profile &&
          profile.role === "CANDIDATE" &&
          profile.isProfileComplete
        );
      });

      if (profilesById.length) {
        return { status: "success", data: profilesById.slice(0, 4) };
      }

      const listResult = await fetchFromApi<{ users: FeaturedProfile[] }>(
        "/users?role=CANDIDATE&limit=50",
      );
      if (listResult.status !== "success") return { status: "error" };

      const wantedKeys = new Set(FEATURED_PROFILE_KEYS.map(normalizeKey));
      return {
        status: "success",
        data: listResult.data.users
          .filter((profile) => wantedKeys.has(normalizeKey(fullName(profile))))
          .slice(0, 4),
      };
    }

    const result = await fetchFromApi<FeaturedProfile[]>("/users/featured");
    if (result.status !== "success") return result;

    return { status: "success", data: result.data.slice(0, 4) };
  } catch {
    return { status: "error" };
  }
}

function CandidateSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 h-12 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function FeaturedCandidates() {
  const [candidates, setCandidates] = useState<FeaturedProfile[]>([]);
  const [status, setStatus] = useState<ApiLoadStatus>("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      const result = await fetchFeaturedProfiles();
      if (cancelled) return;

      if (result.status === "success") {
        setCandidates(result.data);
        setStatus("success");
        return;
      }

      setCandidates([]);
      setStatus(result.status === "not-found" ? "error" : result.status);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  if (status === "success" && candidates.length === 0) {
    return null;
  }

  if (status === "error" || status === "unconfigured") {
    return (
      <section id="talents" className="py-24 lg:py-32 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-medium tracking-widest uppercase text-accent">
              Talents
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold font-serif tracking-tight text-foreground text-balance">
              Candidats mis en avant
            </h2>
          </div>
          <ApiLoadState
            status={status}
            onRetry={() => setRetryCount((n) => n + 1)}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="talents" className="py-24 lg:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>
            <p className="text-sm font-medium tracking-widest uppercase text-accent">
              Talents
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold font-serif tracking-tight text-foreground text-balance">
              Candidats mis en avant
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
              Des professionnels vérifiés, prêts à rejoindre votre prochaine
              production.
            </p>
            {status === "loading" ? (
              <ApiLoadState status="loading" className="mt-4" />
            ) : null}
          </div>
          <Button
            variant="ghost"
            className="text-accent hover:text-accent/80 hover:bg-accent/5 self-start sm:self-auto"
            asChild
          >
            <Link href="/candidats">
              Voir tous les profils
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {status === "loading"
            ? Array.from({ length: 4 }).map((_, i) => (
                <CandidateSkeleton key={i} />
              ))
            : candidates.map((candidate) => {
                const name = fullName(candidate) || "Talent";
                const primarySkill = candidate.skills[0] ?? "Audiovisuel";

                return (
                  <Link
                    key={candidate.id}
                    href={`/candidats/${candidate.id}`}
                    className="group block bg-card rounded-xl border border-border p-5 hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={candidate.profilePicture}
                        name={name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">
                          {name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                          {primarySkill}
                        </p>
                        {candidate.rate ? (
                          <p className="mt-0.5 text-sm text-muted-foreground whitespace-nowrap">
                            {candidate.rate} €/jour
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {candidate.description?.trim() && (
                      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {candidate.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}
