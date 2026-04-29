import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { getApiBaseUrl } from '@/lib/api';

type PublicUser = {
  id: string;
  role: 'RECRUITER' | 'CANDIDATE';
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  description: string | null;
  skills: string[];
  rate: number | null;
  isProfileComplete: boolean;
};

async function getCandidate(id: string): Promise<PublicUser | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  const res = await fetch(`${apiBaseUrl}/users/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as PublicUser;
}

export default async function CandidatePublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidate(id);

  if (!candidate) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Candidat introuvable
            </h1>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Vérifiez l’URL ou réessayez plus tard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = `${candidate.firstName ?? ''} ${candidate.lastName ?? ''}`.trim() || '—';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex items-start gap-4">
        <Avatar src={candidate.profilePicture} name={name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-neutral-900 dark:text-white">
            {name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {candidate.rate ? `${candidate.rate} €/jour` : 'Tarif non renseigné'}
            </p>
            <span
              className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                candidate.isProfileComplete
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
              ].join(' ')}
            >
              {candidate.isProfileComplete ? 'Profil complet' : 'Profil incomplet'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Description
            </h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
              {candidate.description?.trim() ? candidate.description : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Compétences
            </h2>
          </CardHeader>
          <CardContent>
            {candidate.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">—</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

