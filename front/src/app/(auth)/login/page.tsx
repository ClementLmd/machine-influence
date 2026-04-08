'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const supabase = createClient();

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setServerError('Email ou mot de passe incorrect.');
      } else {
        setServerError(error.message);
      }
      return;
    }

    const session = signInData.session;
    const user = signInData.user;

    if (session && user) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        const meRes = await fetch(`${apiUrl}/users/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });

        if (!meRes.ok) {
          const role = user.user_metadata?.role as string | undefined;
          if (role) {
            await fetch(`${apiUrl}/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ role }),
            });
          }
        }
      }
    }

    router.push('/');
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Se connecter
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Pas encore inscrit ?{' '}
          <Link
            href="/register"
            className="text-neutral-900 underline hover:no-underline dark:text-white"
          >
            Créer un compte
          </Link>
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
