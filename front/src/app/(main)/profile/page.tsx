'use client';

import { useEffect, useMemo, useState } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getApiBaseUrl } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

type UserProfile = {
  id: string;
  role: 'RECRUITER' | 'INDEPENDENT';
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
  isProfileComplete: boolean;
};

type Tab = 'candidat' | 'mes-annonces';

async function getAccessToken() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function ProfilePage() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [tab, setTab] = useState<Tab>('candidat');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skillsText, setSkillsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!apiBaseUrl) {
          throw new Error('NEXT_PUBLIC_API_URL manquant');
        }
        const token = await getAccessToken();
        if (!token) throw new Error('Vous devez être connecté.');

        const res = await fetch(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Impossible de charger le profil');
        const data = (await res.json()) as UserProfile;
        if (cancelled) return;
        setProfile(data);
        setSkillsText((data.skills ?? []).join(', '));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Une erreur est survenue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const onSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL manquant');
      }
      const token = await getAccessToken();
      if (!token) throw new Error('Vous devez être connecté.');

      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${apiBaseUrl}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          description: profile.description,
          skills,
          rate: profile.rate,
        }),
      });

      if (!res.ok) throw new Error("Impossible d'enregistrer");
      const next = (await res.json()) as UserProfile;
      setProfile(next);
      setSkillsText((next.skills ?? []).join(', '));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarSelected = async (file: File) => {
    if (!profile) return;
    setAvatarUploading(true);
    setError(null);
    try {
      if (!apiBaseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL manquant');
      }
      const token = await getAccessToken();
      if (!token) throw new Error('Vous devez être connecté.');

      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${apiBaseUrl}/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      if (!res.ok) throw new Error("Impossible d'uploader l'avatar");
      const next = (await res.json()) as UserProfile;
      setProfile(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Mon profil
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Complétez votre profil pour apparaître dans la recherche.
          </p>
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <Avatar src={profile.profilePicture} name={fullName || profile.email} size="lg" />
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {fullName || '—'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {profile.isProfileComplete ? 'Profil complet' : 'Profil incomplet'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-2 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
        <button
          type="button"
          onClick={() => setTab('candidat')}
          className={[
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            tab === 'candidat'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/40',
          ].join(' ')}
        >
          Candidat
        </button>
        <button
          type="button"
          onClick={() => setTab('mes-annonces')}
          className={[
            'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            tab === 'mes-annonces'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
              : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/40',
          ].join(' ')}
        >
          Mes annonces
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Chargement…</p>
            </CardHeader>
          </Card>
        </div>
      ) : tab === 'mes-annonces' ? (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Mes annonces / candidatures
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Cette section sera connectée aux epics annonces/candidatures.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Placeholder.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Informations candidat
              </h2>
            </CardHeader>
            <CardContent>
              {!profile ? (
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Aucun profil trouvé.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={profile.profilePicture}
                        name={fullName || profile.email}
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          Avatar
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          PNG/JPG, 5MB max
                        </p>
                      </div>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={avatarUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void onAvatarSelected(file);
                          e.currentTarget.value = '';
                        }}
                      />
                      <Button type="button" variant="secondary" isLoading={avatarUploading}>
                        Changer
                      </Button>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Prénom"
                      value={profile.firstName ?? ''}
                      onChange={(e) =>
                        setProfile((p) => (p ? { ...p, firstName: e.target.value } : p))
                      }
                    />
                    <Input
                      label="Nom"
                      value={profile.lastName ?? ''}
                      onChange={(e) =>
                        setProfile((p) => (p ? { ...p, lastName: e.target.value } : p))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Description
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-neutral-500"
                      rows={5}
                      value={profile.description ?? ''}
                      onChange={(e) =>
                        setProfile((p) => (p ? { ...p, description: e.target.value } : p))
                      }
                    />
                  </div>

                  <Input
                    label="Compétences (séparées par des virgules)"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="Montage, Étalo, Prise de son…"
                  />

                  <Input
                    label="Tarif (€/jour)"
                    type="number"
                    value={profile.rate ?? ''}
                    onChange={(e) =>
                      setProfile((p) =>
                        p
                          ? {
                              ...p,
                              rate: e.target.value === '' ? null : Number(e.target.value),
                            }
                          : p,
                      )
                    }
                    placeholder="350"
                  />

                  <div className="flex justify-end">
                    <Button type="button" onClick={onSave} isLoading={saving}>
                      Enregistrer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

