import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
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

const FEATURED_PROFILE_KEYS = (process.env.FEATURED_PROFILE_KEYS ?? "")
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

async function getFeaturedProfiles(): Promise<FeaturedProfile[]> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return [];

  try {
    if (FEATURED_PROFILE_KEYS.length) {
      const byId = await Promise.all(
        FEATURED_PROFILE_KEYS.map(async (key) => {
          const res = await fetch(
            `${apiBaseUrl}/users/${encodeURIComponent(key)}`,
            {
              cache: "no-store",
            },
          );
          if (!res.ok) return null;
          return (await res.json()) as FeaturedProfile;
        }),
      );

      const profilesById = byId.filter(
        (profile): profile is FeaturedProfile => {
          return (
            !!profile &&
            profile.role === "CANDIDATE" &&
            profile.isProfileComplete
          );
        },
      );

      if (profilesById.length) return profilesById.slice(0, 4);

      const res = await fetch(`${apiBaseUrl}/users?role=CANDIDATE&limit=50`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { users: FeaturedProfile[] };
      const wantedKeys = new Set(FEATURED_PROFILE_KEYS.map(normalizeKey));

      return data.users
        .filter((profile) => wantedKeys.has(normalizeKey(fullName(profile))))
        .slice(0, 4);
    }

    const res = await fetch(`${apiBaseUrl}/users/featured`, {
      cache: "no-store",
    });
    if (!res.ok) return [];

    return ((await res.json()) as FeaturedProfile[]).slice(0, 4);
  } catch {
    return [];
  }
}

export async function FeaturedCandidates() {
  const candidates = await getFeaturedProfiles();

  if (candidates.length === 0) {
    return null;
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
          {candidates.map((candidate) => {
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
