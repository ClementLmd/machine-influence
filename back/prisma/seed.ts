import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const mode = process.env.SEED_MODE === 'prod' ? 'prod' : 'dev';
const isProdSeed = mode === 'prod';

if (isProdSeed && process.env.SEED_PROD !== 'true') {
  throw new Error('Refusing to run prod seed without SEED_PROD=true.');
}

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const SEED_EMAIL_DOMAINS = [
  'seed.machine-influence.test',
  'dev.machine-influence.test',
];

const DEV_RECRUITER = {
  email: 'recruiter@dev.machine-influence.test',
  password: 'Password123!',
  fallbackSupabaseId: 'seed-dev-recruiter-auth',
  firstName: 'Camille',
  lastName: 'Leroy',
};

const DEV_CANDIDATE = {
  email: 'candidate@dev.machine-influence.test',
  password: 'Password123!',
  fallbackSupabaseId: 'seed-dev-candidate-auth',
  firstName: 'Nina',
  lastName: 'Morel',
};

const recruiters = [
  {
    firstName: 'Camille',
    lastName: 'Leroy',
    company: 'Atelier Lumière Rouen',
    description:
      'Production locale spécialisée dans les clips, films institutionnels et portraits documentaires autour de Rouen.',
  },
  {
    firstName: 'Thomas',
    lastName: 'Benoit',
    company: 'Seine Image',
    description:
      'Collectif audiovisuel rouennais qui accompagne associations, artistes et marques locales.',
  },
  {
    firstName: 'Sarah',
    lastName: 'Duval',
    company: 'Plateau Rive Droite',
    description:
      'Agence créative basée à Rouen, orientée contenus courts, campagnes social media et événements culturels.',
  },
  {
    firstName: 'Mathieu',
    lastName: 'Carpentier',
    company: 'Studio 76',
    description:
      'Studio de production normand pour captations, interviews, formats web et projets de fiction.',
  },
  {
    firstName: 'Léa',
    lastName: 'Fontaine',
    company: 'Rouen Casting',
    description:
      'Direction de production pour projets étudiants, publicités locales et tournages indépendants.',
  },
  {
    firstName: 'Yanis',
    lastName: 'Haddad',
    company: 'Normandie Motion',
    description:
      'Équipe vidéo mobile pour documentaires courts, teasers événementiels et productions institutionnelles.',
  },
];

const candidates = [
  {
    firstName: 'Nina',
    lastName: 'Morel',
    skills: ['Montage vidéo', 'Étalonnage', 'DaVinci Resolve'],
    rate: 280,
    description:
      'Monteuse vidéo basée à Rouen, habituée aux clips, formats courts et contenus pour les réseaux sociaux.',
  },
  {
    firstName: 'Hugo',
    lastName: 'Martin',
    skills: ['Caméra', 'Lumière', 'Court-métrage'],
    rate: 320,
    description:
      'Chef opérateur disponible pour fictions courtes, interviews et tournages légers en Normandie.',
  },
  {
    firstName: 'Inès',
    lastName: 'Rousseau',
    skills: ['Photographie', 'Portrait', 'Retouche'],
    rate: 240,
    description:
      'Photographe portrait et plateau, avec une approche naturelle pour artistes, marques et institutions.',
  },
  {
    firstName: 'Noah',
    lastName: 'Petit',
    skills: ['Son direct', 'Mixage', 'Podcast'],
    rate: 300,
    description:
      'Ingénieur son autonome avec kit léger, disponible pour documentaire, interview et captation live.',
  },
  {
    firstName: 'Emma',
    lastName: 'Garnier',
    skills: ['Motion design', 'After Effects', 'Illustration'],
    rate: 350,
    description:
      'Motion designer pour habillages vidéo, génériques, animations explicatives et contenus de marque.',
  },
  {
    firstName: 'Louis',
    lastName: 'Mercier',
    skills: ['Réalisation', 'Scénario', 'Direction artistique'],
    rate: 380,
    description:
      'Réalisateur de courts formats narratifs et publicitaires, sensible aux univers visuels forts.',
  },
  {
    firstName: 'Maya',
    lastName: 'Bernard',
    skills: ['Maquillage', 'Coiffure', 'Mode'],
    rate: 220,
    description:
      'Maquilleuse plateau pour shooting, clip et fiction, avec expérience en raccords et looks naturels.',
  },
  {
    firstName: 'Adam',
    lastName: 'Lefèvre',
    skills: ['Drone', 'Caméra', 'Immobilier'],
    rate: 420,
    description:
      'Télépilote drone et cadreur, spécialisé dans plans extérieurs, patrimoine et vidéos immobilières.',
  },
  {
    firstName: 'Clara',
    lastName: 'Simon',
    skills: ['Production', 'Régie', 'Casting'],
    rate: 260,
    description:
      "Assistante de production organisée, à l'aise avec feuilles de service, planning et coordination plateau.",
  },
  {
    firstName: 'Ethan',
    lastName: 'Robert',
    skills: ['Acting', 'Voix off', 'Théâtre'],
    rate: 180,
    description:
      'Comédien et voix off, disponible pour fiction, publicité locale, narration et formats institutionnels.',
  },
  {
    firstName: 'Julie',
    lastName: 'Masson',
    skills: ['Community management', 'Vidéo mobile', 'TikTok'],
    rate: 230,
    description:
      'Créatrice de contenus courts pour marques locales, avec tournage mobile, montage rapide et publication.',
  },
  {
    firstName: 'Mehdi',
    lastName: 'Aubert',
    skills: ['Assistant caméra', 'Focus puller', 'Matériel'],
    rate: 250,
    description:
      'Assistant caméra rigoureux, disponible pour préparation matériel, optiques, clap et rapports caméra.',
  },
  {
    firstName: 'Lola',
    lastName: 'Chevalier',
    skills: ['Stylisme', 'Direction artistique', 'Shooting'],
    rate: 270,
    description:
      'Styliste et assistante DA pour campagnes mode, portraits artistes et shootings éditoriaux.',
  },
  {
    firstName: 'Raphaël',
    lastName: 'Girard',
    skills: ['VFX', 'Compositing', 'Blender'],
    rate: 390,
    description:
      'Généraliste VFX pour nettoyage de plans, compositing léger, incrustation et intégrations 3D.',
  },
  {
    firstName: 'Anaïs',
    lastName: 'Perrin',
    skills: ['Journalisme', 'Interview', 'Documentaire'],
    rate: 310,
    description:
      'Journaliste vidéo orientée récits humains, interviews terrain et formats documentaires courts.',
  },
  {
    firstName: 'Samuel',
    lastName: 'Fournier',
    skills: ['Photographie événementielle', 'Retouche', 'Lightroom'],
    rate: 260,
    description:
      'Photographe événementiel pour vernissages, concerts, conférences et coulisses de tournage.',
  },
  {
    firstName: 'Zoé',
    lastName: 'Lambert',
    skills: ['Script', 'Continuité', 'Fiction'],
    rate: 210,
    description:
      'Scripte attentive aux raccords, dialogues et rapports de production pour courts et moyens métrages.',
  },
  {
    firstName: 'Bastien',
    lastName: 'Andre',
    skills: ['Streaming', 'Captation multicam', 'OBS'],
    rate: 340,
    description:
      'Technicien captation et streaming pour conférences, concerts, événements associatifs et lives web.',
  },
  {
    firstName: 'Manon',
    lastName: 'Roy',
    skills: ['Décoration', 'Accessoires', 'Scénographie'],
    rate: 240,
    description:
      'Décoratrice plateau pour clips, shootings et fictions courtes, avec réseau local de ressourceries.',
  },
  {
    firstName: 'Ibrahim',
    lastName: 'Nguyen',
    skills: ['Photogrammétrie', '3D', 'Unreal Engine'],
    rate: 410,
    description:
      'Artiste 3D pour visualisation, assets temps réel, scans simples et décors virtuels.',
  },
  {
    firstName: 'Alice',
    lastName: 'Colin',
    skills: ['Sous-titrage', 'Traduction', 'Accessibilité'],
    rate: 190,
    description:
      'Spécialiste sous-titrage français et anglais pour interviews, contenus web et films courts.',
  },
  {
    firstName: 'Maxime',
    lastName: 'Renard',
    skills: ['Gaffer', 'Électricité plateau', 'Lumière'],
    rate: 330,
    description:
      'Électricien et gaffer pour équipes réduites, avec expérience en setups rapides et lieux exigus.',
  },
  {
    firstName: 'Sofia',
    lastName: 'Baron',
    skills: ['Danse', 'Chorégraphie', 'Performance'],
    rate: 220,
    description:
      'Danseuse et chorégraphe pour clips, performances filmées et projets artistiques expérimentaux.',
  },
  {
    firstName: 'Arthur',
    lastName: 'Vidal',
    skills: ['Storyboard', 'Illustration', 'Préproduction'],
    rate: 290,
    description:
      'Storyboarder et illustrateur pour intentions visuelles, découpages techniques et dossiers de prod.',
  },
];

const announcementTemplates = [
  {
    title: 'Court-métrage étudiant cherche chef opérateur',
    role: 'Chef opérateur',
    productionType: 'Court-métrage',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Clip musical à Rouen cherche monteur vidéo',
    role: 'Monteur vidéo',
    productionType: 'Clip musical',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Shooting photo pour marque locale centre-ville de Rouen',
    role: 'Photographe',
    productionType: 'Shooting photo',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Documentaire associatif cherche ingénieur son',
    role: 'Ingénieur son',
    productionType: 'Documentaire',
    location: 'Sotteville-les-Rouen',
    isPaid: true,
  },
  {
    title: 'Tournage institutionnel rive gauche cherche assistant caméra',
    role: 'Assistant caméra',
    productionType: 'Film institutionnel',
    location: 'Rouen rive gauche',
    isPaid: true,
  },
  {
    title: 'Websérie indépendante cherche comédien pour second rôle',
    role: 'Comédien',
    productionType: 'Websérie',
    location: 'Mont-Saint-Aignan',
    isPaid: false,
  },
  {
    title: 'Captation concert au 106 cherche cadreur multicam',
    role: 'Cadreur',
    productionType: 'Captation live',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Interview patrimoine cherche journaliste vidéo',
    role: 'Journaliste vidéo',
    productionType: 'Interview',
    location: 'Bois-Guillaume',
    isPaid: true,
  },
  {
    title: 'Film de marque artisan local cherche motion designer',
    role: 'Motion designer',
    productionType: 'Film de marque',
    location: 'Le Petit-Quevilly',
    isPaid: true,
  },
  {
    title: 'Publicité locale cherche maquilleuse plateau',
    role: 'Maquilleuse',
    productionType: 'Publicité',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Teaser événementiel cherche télépilote drone',
    role: 'Télépilote drone',
    productionType: 'Teaser événementiel',
    location: 'Elbeuf',
    isPaid: true,
  },
  {
    title: 'Fiction courte cherche scripte pour deux jours',
    role: 'Scripte',
    productionType: 'Fiction',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Podcast vidéo cherche technicien streaming',
    role: 'Technicien streaming',
    productionType: 'Podcast vidéo',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Clip danse contemporaine cherche chorégraphe',
    role: 'Chorégraphe',
    productionType: 'Clip artistique',
    location: 'Rouen',
    isPaid: false,
  },
  {
    title: 'Shooting éditorial cherche styliste et accessoires',
    role: 'Styliste',
    productionType: 'Éditorial photo',
    location: 'Rouen',
    isPaid: true,
  },
  {
    title: 'Film associatif cherche sous-titreur français anglais',
    role: 'Sous-titreur',
    productionType: 'Film associatif',
    location: 'Rouen',
    isPaid: false,
  },
  {
    title: 'Spot social media cherche créatrice de contenus mobile',
    role: 'Créateur de contenu',
    productionType: 'Social media',
    location: 'Sotteville-les-Rouen',
    isPaid: true,
  },
  {
    title: 'Préproduction court-métrage cherche storyboarder',
    role: 'Storyboarder',
    productionType: 'Préproduction',
    location: 'Mont-Saint-Aignan',
    isPaid: true,
  },
];

function seedEmail(prefix: string, index: number) {
  return `${prefix}.${String(index + 1).padStart(2, '0')}@seed.machine-influence.test`;
}

function avatarUrl(firstName: string, lastName: string) {
  const seed = encodeURIComponent(`${firstName} ${lastName}`);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
}

function portfolioUrl(firstName: string, lastName: string, index: number) {
  const slug = `${firstName}-${lastName}`.toLowerCase();
  const hosts = [
    'https://portfolio.machine-influence.test',
    'https://vimeo.com',
    'https://www.behance.net',
    'https://www.artstation.com',
  ];

  return `${hosts[index % hosts.length]}/${slug}`;
}

function cvUrl(firstName: string, lastName: string) {
  const slug = `${firstName}-${lastName}`.toLowerCase();
  return `https://example.com/cv/${slug}.pdf`;
}

function dateDaysFromNow(days: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function announcementEndDate(productionType: string, startOffsetDays: number) {
  const durationByProductionType: Record<string, number> = {
    'Court-métrage': 4,
    'Clip musical': 2,
    'Shooting photo': 0,
    Documentaire: 5,
    'Film institutionnel': 2,
    Websérie: 7,
    'Captation live': 0,
    Interview: 0,
    'Film de marque': 2,
    Publicité: 1,
    'Teaser événementiel': 1,
    Fiction: 1,
    'Podcast vidéo': 0,
    'Clip artistique': 2,
    'Éditorial photo': 0,
    'Film associatif': 3,
    'Social media': 1,
    Préproduction: 10,
  };

  const durationDays = durationByProductionType[productionType] ?? 1;

  if (durationDays === 0) {
    return dateDaysFromNow(startOffsetDays, 18);
  }

  return dateDaysFromNow(startOffsetDays + durationDays, 18);
}

async function createDevAuthUser(
  supabase: SupabaseClient,
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    fallbackSupabaseId: string;
  },
) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });

  if (!error && data.user?.id) {
    return data.user.id;
  }

  const { data: users, error: listError } = await supabase.auth.admin.listUsers(
    {
      page: 1,
      perPage: 200,
    },
  );

  if (!listError) {
    const existing = users.users.find((existingUser) => {
      return existingUser.email?.toLowerCase() === user.email.toLowerCase();
    });

    if (existing) {
      return existing.id;
    }
  }

  console.warn(
    `Could not create or find Supabase Auth user ${user.email}: ${error?.message ?? listError?.message}`,
  );

  return user.fallbackSupabaseId;
}

async function getDevAuthIds() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      'Skipping Supabase Auth seed: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.',
    );
    return {
      recruiterSupabaseId: DEV_RECRUITER.fallbackSupabaseId,
      candidateSupabaseId: DEV_CANDIDATE.fallbackSupabaseId,
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const [recruiterSupabaseId, candidateSupabaseId] = await Promise.all([
    createDevAuthUser(supabase, DEV_RECRUITER),
    createDevAuthUser(supabase, DEV_CANDIDATE),
  ]);

  return { recruiterSupabaseId, candidateSupabaseId };
}

async function clearSeedData() {
  await prisma.user.deleteMany({
    where: {
      OR: SEED_EMAIL_DOMAINS.map((domain) => ({
        email: {
          endsWith: domain,
        },
      })),
    },
  });
}

async function seedUsers() {
  const devAuthIds = isProdSeed ? undefined : await getDevAuthIds();

  const recruiterCount = isProdSeed ? 4 : recruiters.length;
  const candidateCount = isProdSeed ? 10 : candidates.length;

  const createdRecruiters = await Promise.all(
    recruiters.slice(0, recruiterCount).map((recruiter, index) => {
      const isDevAuthRecruiter = !isProdSeed && index === 0;
      const email = isDevAuthRecruiter
        ? DEV_RECRUITER.email
        : seedEmail('recruiter', index);

      return prisma.user.create({
        data: {
          supabaseId: isDevAuthRecruiter
            ? devAuthIds!.recruiterSupabaseId
            : `seed-recruiter-${String(index + 1).padStart(2, '0')}`,
          email,
          role: UserRole.RECRUITER,
          firstName: isDevAuthRecruiter
            ? DEV_RECRUITER.firstName
            : recruiter.firstName,
          lastName: isDevAuthRecruiter
            ? DEV_RECRUITER.lastName
            : recruiter.lastName,
          profilePicture: avatarUrl(recruiter.firstName, recruiter.lastName),
          description: `${recruiter.company}. ${recruiter.description}`,
          skills: ['Production', 'Casting', 'Réalisation'],
          portfolioUrl: `https://example.com/${recruiter.company
            .toLowerCase()
            .replaceAll(' ', '-')}`,
          isProfileComplete: true,
        },
      });
    }),
  );

  await Promise.all(
    candidates.slice(0, candidateCount).map((candidate, index) => {
      const isDevAuthCandidate = !isProdSeed && index === 0;
      const email = isDevAuthCandidate
        ? DEV_CANDIDATE.email
        : seedEmail('candidate', index);

      return prisma.user.create({
        data: {
          supabaseId: isDevAuthCandidate
            ? devAuthIds!.candidateSupabaseId
            : `seed-candidate-${String(index + 1).padStart(2, '0')}`,
          email,
          role: 'CANDIDATE' as UserRole,
          firstName: isDevAuthCandidate
            ? DEV_CANDIDATE.firstName
            : candidate.firstName,
          lastName: isDevAuthCandidate
            ? DEV_CANDIDATE.lastName
            : candidate.lastName,
          profilePicture: avatarUrl(candidate.firstName, candidate.lastName),
          description: candidate.description,
          skills: candidate.skills,
          rate: candidate.rate,
          portfolioUrl: portfolioUrl(
            candidate.firstName,
            candidate.lastName,
            index,
          ),
          cvUrl:
            index % 4 === 0
              ? null
              : cvUrl(candidate.firstName, candidate.lastName),
          isProfileComplete: true,
        },
      });
    }),
  );

  return createdRecruiters;
}

async function seedAnnouncements(recruiterIds: string[]) {
  const announcementCount = isProdSeed ? 8 : announcementTemplates.length;

  await Promise.all(
    announcementTemplates
      .slice(0, announcementCount)
      .map((announcement, index) => {
        const startOffsetDays = 7 + index * 3;
        const startDate = dateDaysFromNow(startOffsetDays);
        const endDate = announcementEndDate(
          announcement.productionType,
          startOffsetDays,
        );

        return prisma.$executeRaw`
          INSERT INTO "Announcement" (
            "id",
            "recruiterId",
            "title",
            "role",
            "productionType",
            "location",
            "isPaid",
            "startDate",
            "endDate",
            "updatedAt"
          )
          VALUES (
            ${randomUUID()},
            ${recruiterIds[index % recruiterIds.length]},
            ${announcement.title},
            ${announcement.role},
            ${announcement.productionType},
            ${announcement.location},
            ${announcement.isPaid},
            ${startDate},
            ${endDate},
            ${new Date()}
          )
        `;
      }),
  );
}

async function main() {
  console.info(`Running ${mode} seed...`);

  await clearSeedData();

  const createdRecruiters = await seedUsers();
  await seedAnnouncements(createdRecruiters.map((recruiter) => recruiter.id));

  console.info(
    `${mode} seed complete: ${isProdSeed ? 4 : recruiters.length} recruiters, ${
      isProdSeed ? 10 : candidates.length
    } candidates, ${isProdSeed ? 8 : announcementTemplates.length} announcements.`,
  );

  if (!isProdSeed) {
    console.info(
      `Dev recruiter: ${DEV_RECRUITER.email} / ${DEV_RECRUITER.password}`,
    );
    console.info(
      `Dev candidate: ${DEV_CANDIDATE.email} / ${DEV_CANDIDATE.password}`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
