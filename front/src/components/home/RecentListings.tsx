import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Calendar, ArrowRight, Euro, X } from "lucide-react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api";
import { calculateDuration } from "@/lib/utils";
import type { AnnouncementWithRecruiter } from "@machine-influence/shared/types";

async function getRecentAnnouncements(): Promise<AnnouncementWithRecruiter[]> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return [];

  try {
    const res = await fetch(`${apiBaseUrl}/announcements?limit=4`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    return (await res.json()) as AnnouncementWithRecruiter[];
  } catch {
    return [];
  }
}

export async function RecentListings() {
  const announcements = await getRecentAnnouncements();

  if (announcements.length === 0) {
    return null;
  }

  return (
    <section id="listings" className="py-24 lg:py-32 bg-secondary">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>
            <p className="text-sm font-medium tracking-widest uppercase text-accent">
              Opportunités
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold font-serif tracking-tight text-foreground text-balance">
              Annonces récentes
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
              Les dernières missions publiées par des recruteurs à la
              recherche de talents comme vous.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-accent hover:text-accent/80 hover:bg-accent/5 self-start sm:self-auto"
            asChild
          >
            <Link href="/annonces">
              Voir toutes les annonces
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((announcement) => {
            const recruiterName =
              `${announcement.recruiter.firstName ?? ""} ${announcement.recruiter.lastName ?? ""}`.trim() ||
              "Recruteur";
            const duration = calculateDuration(
              announcement.startDate,
              announcement.endDate
            );

            return (
              <Link
                key={announcement.id}
                href={`/annonces/${announcement.id}`}
                className="group block bg-card rounded-xl border border-border p-6 hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recruiterName}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {announcement.productionType}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {announcement.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {duration} jour{duration > 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {announcement.isPaid ? (
                      <>
                        <Euro className="size-3.5 text-green-600" />
                        <span className="text-green-600 font-medium">
                          Rémunéré
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="size-3.5" />
                        <span>Non rémunéré</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Rôle:
                  </span>{" "}
                  <span className="text-xs text-foreground">
                    {announcement.role}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
