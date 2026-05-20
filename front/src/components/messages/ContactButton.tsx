"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

interface ContactButtonProps {
  recipientId: string;
  recipientName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function ContactButton({
  recipientId,
  recipientName,
  variant = 'default',
  size = 'default',
  className,
}: ContactButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContact = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw new Error('Configuration manquante');
      }

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // Rediriger vers la page de connexion
        router.push('/login');
        return;
      }

      // Démarrer ou récupérer la conversation
      const res = await fetch(`${apiBaseUrl}/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ recipientId }),
      });

      if (!res.ok) {
        throw new Error('Impossible de démarrer la conversation');
      }

      const data = (await res.json()) as { id: string; isNew: boolean };

      // Rediriger vers la page de messages avec la conversation sélectionnée
      router.push(`/messages?conversation=${data.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue. Veuillez réessayer.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleContact}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
      isLoading={loading}
    >
      <MessageCircle className="mr-2 size-4" />
      {recipientName ? `Contacter ${recipientName}` : 'Contacter'}
    </Button>
  );
}
