'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { calculateDuration } from '@/lib/utils';
import type { CreateAnnouncementDto } from '@machine-influence/shared/dto';

const schema = z
  .object({
    title: z
      .string()
      .min(3, 'Le titre doit contenir au moins 3 caractères')
      .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
    role: z
      .string()
      .min(2, 'Le rôle doit contenir au moins 2 caractères')
      .max(100, 'Le rôle ne peut pas dépasser 100 caractères'),
    productionType: z
      .string()
      .min(2, 'Le type de production doit contenir au moins 2 caractères')
      .max(100, 'Le type de production ne peut pas dépasser 100 caractères'),
    location: z
      .string()
      .min(2, 'Le lieu doit contenir au moins 2 caractères')
      .max(200, 'Le lieu ne peut pas dépasser 200 caractères'),
    isPaid: z.boolean(),
    startDate: z.string().min(1, 'La date de début est requise'),
    endDate: z.string().min(1, 'La date de fin est requise'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return start >= today;
    },
    {
      message: 'La date de début ne peut pas être antérieure à aujourd\'hui',
      path: ['startDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'La date de fin doit être postérieure à la date de début. Veuillez choisir une date ultérieure.',
      path: ['endDate'],
    }
  );

type FormValues = z.infer<typeof schema>;

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);

  // Get today's date in YYYY-MM-DD format for the min attribute
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isPaid: false,
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is a recruiter
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        router.push('/login');
        return;
      }

      const userData = await res.json();
      if (userData.role !== 'RECRUITER') {
        setServerError('Seuls les recruteurs peuvent créer des annonces.');
        setIsAccessBlocked(true);
        setIsCheckingAuth(false);
        setTimeout(() => router.push('/annonces'), 3000);
        return;
      }

      if (!userData.isProfileComplete) {
        setServerError('Complétez votre profil avant de créer une annonce.');
        setIsAccessBlocked(true);
        setIsCheckingAuth(false);
        setTimeout(() => router.push('/profile'), 3000);
        return;
      }

      setIsCheckingAuth(false);
    }

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (startDate && endDate) {
      try {
        const duration = calculateDuration(startDate, endDate);
        setCalculatedDuration(duration > 0 ? duration : null);
      } catch {
        setCalculatedDuration(null);
      }
    } else {
      setCalculatedDuration(null);
    }
  }, [startDate, endDate]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const supabase = createClient();

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      setServerError('Vous devez être connecté pour créer une annonce.');
      return;
    }

    const payload: CreateAnnouncementDto = {
      title: values.title,
      role: values.role,
      productionType: values.productionType,
      location: values.location,
      isPaid: values.isPaid,
      startDate: values.startDate,
      endDate: values.endDate,
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    router.push('/annonces');
  };

  if (isCheckingAuth) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/annonces">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux annonces
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-foreground font-serif">
            Créer une annonce
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publiez une opportunité pour trouver les talents dont vous avez besoin.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Votre profil recruteur doit être complet avant publication.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
                {serverError.includes('profil') && (
                  <Link
                    href="/profile"
                    className="ml-1 font-medium underline underline-offset-2"
                  >
                    Aller au profil
                  </Link>
                )}
              </div>
            )}

            <Input
              label="Titre de l'annonce"
              placeholder="ex: Cadreur pour court-métrage"
              error={errors.title?.message}
              {...register('title')}
            />

            <Input
              label="Rôle recherché"
              placeholder="ex: Cadreur, Acteur, Ingénieur son..."
              error={errors.role?.message}
              {...register('role')}
            />

            <Input
              label="Type de production"
              placeholder="ex: Court-métrage, Long-métrage, Série TV..."
              error={errors.productionType?.message}
              {...register('productionType')}
            />

            <Input
              label="Lieu de tournage"
              placeholder="ex: Paris, Lyon..."
              error={errors.location?.message}
              {...register('location')}
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPaid"
                className="size-4 rounded border-border"
                {...register('isPaid')}
              />
              <label htmlFor="isPaid" className="text-sm text-foreground cursor-pointer">
                Cette mission est rémunérée
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Date de début"
                type="date"
                min={today}
                error={errors.startDate?.message}
                {...register('startDate')}
              />

              <Input
                label="Date de fin"
                type="date"
                min={startDate || today}
                error={errors.endDate?.message}
                {...register('endDate')}
              />
            </div>

            <div className="rounded-lg bg-muted/50 px-4 py-3 border border-border">
              <p className="text-xs text-muted-foreground">
                💡 <span className="font-medium">Astuce :</span> La date de début doit être aujourd&apos;hui ou ultérieure, 
                et la date de fin doit être postérieure à la date de début.
              </p>
            </div>

            {calculatedDuration !== null && calculatedDuration > 0 && (
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-sm text-muted-foreground">
                  Durée du tournage:{' '}
                  <span className="font-medium text-foreground">
                    {calculatedDuration} jour{calculatedDuration > 1 ? 's' : ''}
                  </span>
                </p>
              </div>
            )}

            {calculatedDuration !== null && calculatedDuration <= 0 && startDate && endDate && (
              <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                <p className="text-sm text-destructive">
                  ⚠️ La date de fin doit être après la date de début
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting || isAccessBlocked} className="flex-1">
                {isSubmitting ? 'Création...' : 'Créer l\'annonce'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/annonces">Annuler</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
