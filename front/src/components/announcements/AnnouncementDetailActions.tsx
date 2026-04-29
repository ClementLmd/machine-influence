'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface AnnouncementDetailActionsProps {
  announcementId: string;
  announcementTitle: string;
}

export function AnnouncementDetailActions({
  announcementId,
  announcementTitle,
}: AnnouncementDetailActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/annonces/${announcementId}/edit`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Non authentifié');
      }

      const { getApiBaseUrl } = await import('@/lib/api');
      const apiBaseUrl = getApiBaseUrl();

      const res = await fetch(`${apiBaseUrl}/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      // Redirect to announcements list
      router.push('/annonces');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Erreur lors de la suppression de l\'annonce');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
          <Edit className="size-4" />
          Modifier
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2"
        >
          <Trash2 className="size-4" />
          Supprimer
        </Button>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer l'annonce"
      >
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Êtes-vous sûr de vouloir supprimer l&apos;annonce <strong>&quot;{announcementTitle}&quot;</strong> ? Cette
            action est irréversible.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
