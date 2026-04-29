'use client';

import Link from 'next/link';
import { MapPin, Calendar, Euro, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { calculateDuration } from '@/lib/utils';
import { AnnouncementCardActions } from './AnnouncementCardActions';
import type { AnnouncementWithRecruiter } from '@machine-influence/shared/types';

interface AnnouncementCardProps {
  announcement: AnnouncementWithRecruiter;
  isOwn: boolean;
}

export function AnnouncementCard({ announcement, isOwn }: AnnouncementCardProps) {
  const recruiterName =
    `${announcement.recruiter.firstName ?? ''} ${announcement.recruiter.lastName ?? ''}`.trim() ||
    'Recruteur';
  const duration = calculateDuration(announcement.startDate, announcement.endDate);

  return (
    <Card
      className={`h-full transition-all hover:shadow-sm relative ${
        isOwn ? 'border-accent hover:border-accent/80' : 'hover:border-accent/30'
      }`}
    >
      {isOwn && (
        <div className="absolute top-3 right-3 z-10">
          <AnnouncementCardActions
            announcementId={announcement.id}
            announcementTitle={announcement.title}
          />
        </div>
      )}

      <Link href={`/annonces/${announcement.id}`} className="block">
        <CardHeader className={`pb-3 ${isOwn ? 'pr-12' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {announcement.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {recruiterName}
                {isOwn && (
                  <span className="ml-2 text-xs text-accent">(Votre annonce)</span>
                )}
              </p>
            </div>
            {!isOwn && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {announcement.productionType}
              </Badge>
            )}
          </div>
          {isOwn && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {announcement.productionType}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Rôle:</span>
              <span>{announcement.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span>{announcement.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0" />
              <span>
                {new Date(announcement.startDate).toLocaleDateString('fr-FR')} -{' '}
                {new Date(announcement.endDate).toLocaleDateString('fr-FR')} ({duration}{' '}
                jour{duration > 1 ? 's' : ''})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {announcement.isPaid ? (
                <>
                  <Euro className="size-4 shrink-0 text-green-600" />
                  <span className="text-green-600 font-medium">Rémunéré</span>
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
      </Link>
    </Card>
  );
}
