'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface AnnouncementFiltersProps {
  canCreateAnnouncements: boolean;
}

export function AnnouncementFilters({ canCreateAnnouncements }: AnnouncementFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';

  if (!canCreateAnnouncements) {
    return null;
  }

  const handleFilterChange = (filter: 'all' | 'mine') => {
    const params = new URLSearchParams(searchParams);
    if (filter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filter);
    }
    router.push(`/annonces?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
      <Button
        variant={currentFilter === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFilterChange('all')}
        className="h-8"
      >
        Toutes les annonces
      </Button>
      <Button
        variant={currentFilter === 'mine' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFilterChange('mine')}
        className="h-8"
      >
        Mes annonces
      </Button>
    </div>
  );
}
