"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ApiLoadState } from "@/components/ui/ApiLoadState";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fetchFromApi, type ApiLoadStatus } from "@/lib/api-fetch";
import { AnnouncementFilters } from "@/components/announcements/AnnouncementFilters";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import type { AnnouncementWithRecruiter } from "@machine-influence/shared/types";

function AnnouncementCardSkeleton() {
  return (
    <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
  );
}

export function AnnouncementsPageContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "all";
  const { currentUser, loading: userLoading } = useCurrentUser();
  const [announcements, setAnnouncements] = useState<
    AnnouncementWithRecruiter[]
  >([]);
  const [status, setStatus] = useState<ApiLoadStatus>("loading");
  const [retryCount, setRetryCount] = useState(0);

  const currentUserId = currentUser?.id ?? null;
  const isRecruiter = currentUser?.role === "RECRUITER";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      const result = await fetchFromApi<AnnouncementWithRecruiter[]>(
        "/announcements",
      );
      if (cancelled) return;

      if (result.status === "success") {
        setAnnouncements(result.data);
        setStatus("success");
        return;
      }

      setAnnouncements([]);
      setStatus(result.status === "not-found" ? "error" : result.status);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const filteredAnnouncements =
    filter === "mine" && currentUserId
      ? announcements.filter((a) => a.recruiterId === currentUserId)
      : announcements;

  const showRecruiterUi = !userLoading && isRecruiter;

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
        {showRecruiterUi && (
          <Button asChild>
            <Link href="/annonces/new">Créer une annonce</Link>
          </Button>
        )}
      </div>

      {showRecruiterUi && (
        <div className="mt-6">
          <AnnouncementFilters canCreateAnnouncements={isRecruiter} />
        </div>
      )}

      {status === "loading" ? (
        <>
          <ApiLoadState status="loading" className="mt-6" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <AnnouncementCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : status === "error" || status === "unconfigured" ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
          <ApiLoadState
            status={status}
            onRetry={() => setRetryCount((n) => n + 1)}
          />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {filter === "mine"
              ? "Vous n'avez pas encore créé d'annonce. Cliquez sur 'Créer une annonce' pour commencer."
              : "Aucune annonce disponible pour le moment. Les recruteurs publieront bientôt des opportunités."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAnnouncements.map((announcement) => {
            const isOwn = currentUserId === announcement.recruiterId;

            return (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isOwn={isOwn}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
