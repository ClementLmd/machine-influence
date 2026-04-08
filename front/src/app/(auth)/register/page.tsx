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

const schema = z
  .object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
    role: z.enum(['RECRUITER', 'INDEPENDENT'] as const, {
      message: 'Veuillez sélectionner un rôle',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedRole = watch('role');

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const supabase = createClient();

    // 1. Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { role: values.role },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setServerError('Un compte existe déjà avec cet email.');
      } else {
        setServerError(signUpError.message);
      }
      return;
    }

    const session = signUpData.session;
    if (!session) {
      // Email confirmation is enabled — redirect anyway, backend will be called after login
      router.push('/login');
      return;
    }

    // 2. Create user in backend DB
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ role: values.role }),
    });

    if (!res.ok && res.status !== 409) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      return;
    }

    router.push('/login');
  };

  return (
    <Card>
      <CardHeader>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Créer un compte
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Déjà inscrit ?{' '}
          <Link
            href="/login"
            className="text-neutral-900 underline hover:no-underline dark:text-white"
          >
            Se connecter
          </Link>
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role selector */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Je suis…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'RECRUITER', label: 'Recruteur', desc: "Je publie des annonces" },
                  { value: 'INDEPENDENT', label: 'Indépendant', desc: "Je cherche des missions" },
                ] as const
              ).map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('role', value, { shouldValidate: true })}
                  className={[
                    'rounded-lg border p-3 text-left transition-colors',
                    selectedRole === value
                      ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800'
                      : 'border-neutral-200 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500',
                  ].join(' ')}
                >
                  <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                    {label}
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {desc}
                  </span>
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>

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
            autoComplete="new-password"
            placeholder="8 caractères minimum"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="Répétez le mot de passe"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Créer mon compte
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
