"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";

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
  portfolioUrl: string | null;
  cvUrl: string | null;
  isProfileComplete: boolean;
  createdAt: string;
};

const ROLE_LABELS: Record<PublicUser["role"], string> = {
  CANDIDATE: "Candidat",
  RECRUITER: "Recruteur",
};

const ROLE_CLASSES: Record<PublicUser["role"], string> = {
  CANDIDATE:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  RECRUITER:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function formatMemberSince(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        <div className="size-16 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
      <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}

export default function CandidatePublicPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [candidate, setCandidate] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<ApiLoadStatus | "not-found">("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      if (!id) {
        setStatus("not-found");
        return;
      }

      const result = await fetchFromApi<PublicUser>(`/users/${id}`);
      if (cancelled) return;

      if (result.status === "success") {
        setCandidate(result.data);
        setStatus("success");
        return;
      }

      setCandidate(null);
      setStatus(result.status);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, retryCount]);

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Link
          href="/candidats"
          className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          ← Retour aux talents
        </Link>
        <ApiLoadState status="loading" className="mb-6" />
        <ProfileSkeleton />
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Candidat introuvable
            </h1>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Vérifiez l&apos;URL ou réessayez plus tard.
            </p>
            <Link href="/candidats" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                ← Retour aux talents
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error" || status === "unconfigured") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Link
          href="/candidats"
          className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          ← Retour aux talents
        </Link>
        <Card>
          <CardContent className="p-8">
            <ApiLoadState
              status={status}
              onRetry={() => setRetryCount((n) => n + 1)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  const name =
    `${candidate.firstName ?? ""} ${candidate.lastName ?? ""}`.trim() || "—";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/candidats"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        ← Retour aux talents
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar src={candidate.profilePicture} name={name} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="truncate text-2xl font-semibold text-neutral-900 dark:text-white">
              {name}
            </h1>
            <span
              className={[
                "mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                ROLE_CLASSES[candidate.role],
              ].join(" ")}
            >
              {ROLE_LABELS[candidate.role]}
            </span>
            <span
              className={[
                "mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                candidate.isProfileComplete
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
              ].join(" ")}
            >
              {candidate.isProfileComplete ? "Profil complet" : "Profil incomplet"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
            {candidate.rate ? (
              <span>{candidate.rate} €/jour</span>
            ) : (
              <span>Tarif non renseigné</span>
            )}
            <span>·</span>
            <span>Membre depuis {formatMemberSince(candidate.createdAt)}</span>
          </div>

          <div className="mt-4">
            <Button asChild>
              <Link href={`/discussion?userId=${candidate.id}`}>
                Contacter
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Description
            </h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
              {candidate.description?.trim() ? candidate.description : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Compétences
            </h2>
          </CardHeader>
          <CardContent>
            {candidate.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">—</p>
            )}
          </CardContent>
        </Card>

        {(candidate.portfolioUrl || candidate.cvUrl) && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Documents & liens
              </h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {candidate.portfolioUrl && (
                  <a
                    href={candidate.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <ExternalLink className="size-4 shrink-0" />
                    Portfolio
                  </a>
                )}
                {candidate.cvUrl && (
                  <a
                    href={candidate.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <FileText className="size-4 shrink-0" />
                    Télécharger le CV
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
