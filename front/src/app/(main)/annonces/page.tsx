import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { getApiBaseUrl } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementFilters } from "@/components/announcements/AnnouncementFilters";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import type { AnnouncementWithRecruiter } from "@machine-influence/shared/types";
import type { UserRole } from "@machine-influence/shared/enums";

async function getAnnouncements(): Promise<AnnouncementWithRecruiter[]> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return [];

  const res = await fetch(`${apiBaseUrl}/announcements`, {
    cache: "no-store",
  });

  if (!res.ok) return [];

  return (await res.json()) as AnnouncementWithRecruiter[];
}

async function getCurrentUser(): Promise<{ id: string; role: UserRole } | null> {
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
    return { id: userData.id, role: userData.role };
  } catch {
    return null;
  }
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || 'all';
  
  const allAnnouncements = await getAnnouncements();
  const currentUser = await getCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const isRecruiter = currentUser?.role === 'RECRUITER';

  // Filter announcements based on the filter parameter
  const announcements = filter === 'mine' && currentUserId
    ? allAnnouncements.filter(a => a.recruiterId === currentUserId)
    : allAnnouncements;

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
        {isRecruiter && (
          <Button asChild>
            <Link href="/annonces/new">Créer une annonce</Link>
          </Button>
        )}
      </div>

      {isRecruiter && (
        <div className="mt-6">
          <AnnouncementFilters canCreateAnnouncements={isRecruiter} />
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {filter === 'mine'
              ? "Vous n'avez pas encore créé d'annonce. Cliquez sur 'Créer une annonce' pour commencer."
              : "Aucune annonce disponible pour le moment. Les recruteurs publieront bientôt des opportunités."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {announcements.map((announcement) => {
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
