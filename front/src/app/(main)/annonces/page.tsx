import Link from "next/link";
import { MapPin, Calendar, Euro, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getApiBaseUrl } from "@/lib/api";
import { calculateDuration } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { AnnouncementWithRecruiter } from "@machine-influence/shared/types";

async function getAnnouncements(): Promise<AnnouncementWithRecruiter[]> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return [];

  const res = await fetch(`${apiBaseUrl}/announcements`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  return (await res.json()) as AnnouncementWithRecruiter[];
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const apiBaseUrl = getApiBaseUrl();
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) return null;

    const res = await fetch(`${apiBaseUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const userData = await res.json();
    return userData.id;
  } catch {
    return null;
  }
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();
  const currentUserId = await getCurrentUserId();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground font-serif">
            Annonces
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Découvrez les opportunités publiées par les recruteurs.
          </p>
        </div>
        {currentUserId && (
          <Button asChild>
            <Link href="/annonces/new">Créer une annonce</Link>
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Aucune annonce disponible pour le moment. Les recruteurs publieront
            bientôt des opportunités.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {announcements.map((announcement) => {
            const isOwn = currentUserId === announcement.recruiterId;
            const recruiterName =
              `${announcement.recruiter.firstName ?? ""} ${announcement.recruiter.lastName ?? ""}`.trim() ||
              "Recruteur";
            const duration = calculateDuration(
              announcement.startDate,
              announcement.endDate
            );

            return (
              <Link key={announcement.id} href={`/annonces/${announcement.id}`}>
                <Card
                  className={`h-full transition-all hover:shadow-sm ${
                    isOwn
                      ? "border-accent hover:border-accent/80"
                      : "hover:border-accent/30"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {announcement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {recruiterName}
                          {isOwn && (
                            <span className="ml-2 text-xs text-accent">
                              (Votre annonce)
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {announcement.productionType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          Rôle:
                        </span>
                        <span>{announcement.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 shrink-0" />
                        <span>{announcement.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4 shrink-0" />
                        <span>
                          {new Date(announcement.startDate).toLocaleDateString(
                            "fr-FR"
                          )}{" "}
                          -{" "}
                          {new Date(announcement.endDate).toLocaleDateString(
                            "fr-FR"
                          )}{" "}
                          ({duration} jour{duration > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {announcement.isPaid ? (
                          <>
                            <Euro className="size-4 shrink-0 text-green-600" />
                            <span className="text-green-600 font-medium">
                              Rémunéré
                            </span>
                          </>
                        ) : (
                          <>
                            <X className="size-4 shrink-0" />
                            <span>Non rémunéré</span>
                          </>
                        )}
                      </div>
                    </div>
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
