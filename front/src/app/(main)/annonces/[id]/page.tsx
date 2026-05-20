"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Calendar, Euro, X, ArrowLeft } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ApiLoadState } from "@/components/ui/ApiLoadState";
import { ContactButton } from "@/components/messages/ContactButton";
import { calculateDuration } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchFromApi, type ApiLoadStatus } from "@/lib/api-fetch";
import { AnnouncementDetailActions } from "@/components/announcements/AnnouncementDetailActions";
import type { AnnouncementWithRecruiter } from "@machine-influence/shared/types";

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { currentUser } = useCurrentUser();
  const [announcement, setAnnouncement] =
    useState<AnnouncementWithRecruiter | null>(null);
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

      const result = await fetchFromApi<AnnouncementWithRecruiter>(
        `/announcements/${id}`,
      );
      if (cancelled) return;

      if (result.status === "success") {
        setAnnouncement(result.data);
        setStatus("success");
        return;
      }

      setAnnouncement(null);
      setStatus(result.status);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, retryCount]);

  const isOwner = currentUser?.id === announcement?.recruiterId;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/annonces">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux annonces
        </Link>
      </Button>

      {status === "loading" ? (
        <>
          <ApiLoadState status="loading" className="mb-4" />
          <DetailSkeleton />
        </>
      ) : status === "not-found" ? (
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-foreground">
              Annonce introuvable
            </h1>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vérifiez l&apos;URL ou réessayez plus tard.
            </p>
          </CardContent>
        </Card>
      ) : status === "error" || status === "unconfigured" ? (
        <Card>
          <CardContent className="p-8">
            <ApiLoadState
              status={status}
              onRetry={() => setRetryCount((n) => n + 1)}
            />
          </CardContent>
        </Card>
      ) : !announcement ? null : (
        (() => {
          const recruiterName =
            `${announcement.recruiter.firstName ?? ""} ${announcement.recruiter.lastName ?? ""}`.trim() ||
            "Recruteur";
          const duration = calculateDuration(
            announcement.startDate,
            announcement.endDate,
          );

          return (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-foreground font-serif">
                      {announcement.title}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Publié le{" "}
                      {new Date(announcement.createdAt).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <Badge className="shrink-0">
                    {announcement.productionType}
                  </Badge>
                </div>

                {isOwner && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <AnnouncementDetailActions
                      announcementId={announcement.id}
                      announcementTitle={announcement.title}
                    />
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Rôle recherché
                  </h2>
                  <p className="text-muted-foreground">{announcement.role}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Lieu de tournage
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-4 shrink-0" />
                      <span>{announcement.location}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Rémunération
                    </h3>
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
                          <X className="size-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Non rémunéré
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Date de début
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4 shrink-0" />
                      <span>
                        {new Date(announcement.startDate).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Date de fin
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-4 shrink-0" />
                      <span>
                        {new Date(announcement.endDate).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Durée du tournage
                  </h3>
                  <p className="text-muted-foreground">
                    {duration} jour{duration > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="pt-6 border-t border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Publié par
                  </h2>
                  <Link href={`/candidats/${announcement.recruiterId}`}>
                    <Card className="hover:shadow-sm transition-shadow">
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar
                          src={announcement.recruiter.profilePicture}
                          name={recruiterName}
                          size="lg"
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {recruiterName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Voir le profil
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  
                  {!isOwner && currentUser && (
                    <div className="mt-4">
                      <ContactButton
                        recipientId={announcement.recruiterId}
                        recipientName={announcement.recruiter.firstName || 'le recruteur'}
                        variant="outline"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()
      )}
    </div>
  );
}
