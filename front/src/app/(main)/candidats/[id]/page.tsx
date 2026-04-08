import Link from "next/link";

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

async function getCandidate(id: string): Promise<PublicUser | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  const res = await fetch(`${apiBaseUrl}/users/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as PublicUser;
}

const ROLE_LABELS: Record<PublicUser["role"], string> = {
  INDEPENDENT: "Indépendant",
  RECRUITER: "Recruteur",
};

const ROLE_CLASSES: Record<PublicUser["role"], string> = {
  INDEPENDENT:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  RECRUITER:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function formatMemberSince(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
}

export default async function CandidatePublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidate(id);

  if (!candidate) {
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
      </div>
    </div>
  );
}
