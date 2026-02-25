# machine-influence

Plateforme de mise en relation pour les professionnels de l’audiovisuel : profils candidats, annonces, candidatures et discussions en temps réel.

**Stack**

- **Front** — Next.js 16, React 19, Tailwind CSS 4, Supabase (auth + storage), Radix UI
- **Back** — NestJS 11, Prisma, PostgreSQL (Supabase), WebSocket (Socket.IO), Supabase JWT
- **Shared** — types, DTOs, enums (pnpm workspace)

Monorepo : `front`, `back`, `shared`.

```bash
pnpm install
pnpm dev
```

| Script    | Command          |
| --------- | ---------------- |
| Dev       | `pnpm dev`       |
| Build     | `pnpm build`     |
| Start     | `pnpm start`     |
| Test      | `pnpm test`      |
| Lint      | `pnpm lint`      |
| Typecheck | `pnpm typecheck` |
| Fullcheck | `pnpm fullcheck` |
