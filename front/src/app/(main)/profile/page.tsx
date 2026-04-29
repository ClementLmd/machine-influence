"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getApiBaseUrl } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, FileText, HelpCircle, X } from "lucide-react";

type UserProfile = {
  id: string;
  role: "RECRUITER" | "INDEPENDENT";
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
  portfolioUrl: string | null;
  cvUrl: string | null;
  isProfileComplete: boolean;
};

type Tab = "candidat" | "mes-annonces";

async function getAccessToken() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function ProfilePage() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const [tab, setTab] = useState<Tab>("candidat");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  const fullName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!apiBaseUrl) {
          throw new Error("NEXT_PUBLIC_API_URL manquant");
        }
        const token = await getAccessToken();
        if (!token) throw new Error("Vous devez être connecté.");

        const res = await fetch(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.status === 404) {
          if (cancelled) return;
          setProfile(null);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Impossible de charger le profil");
        const data = (await res.json()) as UserProfile;
        if (cancelled) return;
        setProfile(data);
        setSkills(data.skills ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Une erreur est survenue");
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
        throw new Error("NEXT_PUBLIC_API_URL manquant");
      }
      const token = await getAccessToken();
      if (!token) throw new Error("Vous devez être connecté.");

      const res = await fetch(`${apiBaseUrl}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          description: profile.description,
          skills,
          rate: profile.rate,
          portfolioUrl: profile.portfolioUrl || null,
        }),
      });

      if (!res.ok) throw new Error("Impossible d'enregistrer");
      const next = (await res.json()) as UserProfile;
      setProfile(next);
      setSkills(next.skills ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const onCvSelected = async (file: File) => {
    if (!profile) return;
    setCvUploading(true);
    setError(null);
    try {
      if (!apiBaseUrl) throw new Error("NEXT_PUBLIC_API_URL manquant");
      const token = await getAccessToken();
      if (!token) throw new Error("Vous devez être connecté.");

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${apiBaseUrl}/users/me/cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Impossible d'uploader le CV");
      const next = (await res.json()) as UserProfile;
      setProfile(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
    } finally {
      setCvUploading(false);
    }
  };

  const normalizeSkill = (value: string) =>
    value.trim().replace(/\s+/g, " ");

  const addSkill = () => {
    const next = normalizeSkill(skillInput);
    if (!next) return;

    if (next.length > 30) {
      setError("Chaque compétence doit faire max 30 caractères");
      return;
    }

    setSkills((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === next.toLowerCase());
      if (exists) return prev;
      return [...prev, next];
    });

    setSkillInput("");
    setError(null);
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const onAvatarSelected = async (file: File) => {
    if (!profile) return;
    setAvatarUploading(true);
    setError(null);
    try {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL manquant");
      }
      const token = await getAccessToken();
      if (!token) throw new Error("Vous devez être connecté.");

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${apiBaseUrl}/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      if (!res.ok) throw new Error("Impossible d'uploader l'avatar");
      const next = (await res.json()) as UserProfile;
      setProfile(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
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
            <Avatar
              src={profile.profilePicture}
              name={fullName || profile.email}
              size="lg"
            />
            <div className="text-right space-y-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {fullName || "—"}
              </p>
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  profile.isProfileComplete
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                ].join(" ")}
              >
                {profile.isProfileComplete
                  ? "Profil complet"
                  : "Profil incomplet"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-2 rounded-xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
        <button
          type="button"
          onClick={() => setTab("candidat")}
          className={[
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "candidat"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/40",
          ].join(" ")}
        >
          Candidat
        </button>
        <button
          type="button"
          onClick={() => setTab("mes-annonces")}
          className={[
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "mes-annonces"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-900/40",
          ].join(" ")}
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
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Chargement…
              </p>
            </CardHeader>
          </Card>
        </div>
      ) : tab === "mes-annonces" ? (
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

                    <div className="inline-flex items-center gap-2">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="sr-only"
                        disabled={avatarUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void onAvatarSelected(file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        isLoading={avatarUploading}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        Changer
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Prénom"
                      value={profile.firstName ?? ""}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, firstName: e.target.value } : p,
                        )
                      }
                    />
                    <Input
                      label="Nom"
                      value={profile.lastName ?? ""}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, lastName: e.target.value } : p,
                        )
                      }
                    />
                  </div>

                  <div>
                    <div className="mb-0.5 flex items-center gap-2">
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                      >
                        Email de contact
                      </label>

                      <div className="relative inline-flex group">
                        <HelpCircle className="size-4 text-neutral-400 dark:text-neutral-500" />
                        <div
                          className={[
                            "pointer-events-none absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 shadow-sm",
                            "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                            "opacity-0 scale-95 transform transition-all duration-150 group-hover:opacity-100 group-hover:scale-100",
                          ].join(" ")}
                        >
                          L&apos;email de connexion reste inchangé.
                        </div>
                      </div>
                    </div>

                    <Input
                      id="contact-email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, email: e.target.value } : p,
                        )
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
                      value={profile.description ?? ""}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, description: e.target.value } : p,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Compétences
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {skills.length ? (
                        skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              aria-label={`Retirer ${skill}`}
                              className="inline-flex rounded-full p-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              onClick={() => removeSkill(skill)}
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                          Aucune compétence pour le moment.
                        </p>
                      )}
                    </div>

                    <Input
                      id="skill-input"
                      placeholder="Tapez une compétence puis Entrée"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      maxLength={30}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Max 30 caractères par compétence.
                    </p>
                  </div>

                  <Input
                    label="Tarif (€/jour)"
                    type="number"
                    min={1}
                    value={profile.rate ?? ""}
                    onChange={(e) =>
                      setProfile((p) =>
                        p
                          ? (() => {
                              const raw = e.target.value;
                              if (raw === "") return { ...p, rate: null };
                              const n = Number(raw);
                              if (!Number.isFinite(n)) return p;
                              const clamped = n <= 0 ? 1 : n;
                              return { ...p, rate: clamped };
                            })()
                          : p,
                      )
                    }
                    placeholder="350"
                  />

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <ExternalLink className="size-4" />
                      Lien portfolio
                    </label>
                    <Input
                      type="url"
                      placeholder="https://monportfolio.com"
                      value={profile.portfolioUrl ?? ""}
                      onChange={(e) =>
                        setProfile((p) =>
                          p ? { ...p, portfolioUrl: e.target.value } : p,
                        )
                      }
                    />
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Site web, Behance, GitHub, LinkedIn…
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <FileText className="size-4" />
                      CV (PDF)
                    </label>
                    <div className="flex items-center gap-3">
                      {profile.cvUrl ? (
                        <a
                          href={profile.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-300"
                        >
                          <FileText className="size-4 shrink-0" />
                          Voir le CV actuel
                        </a>
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Aucun CV déposé.
                        </p>
                      )}
                      <input
                        ref={cvInputRef}
                        type="file"
                        id="cv-upload"
                        accept="application/pdf"
                        className="sr-only"
                        disabled={cvUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void onCvSelected(file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        isLoading={cvUploading}
                        onClick={() => cvInputRef.current?.click()}
                      >
                        {profile.cvUrl ? "Remplacer" : "Déposer un PDF"}
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      PDF uniquement, 5 MB max.
                    </p>
                  </div>

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
