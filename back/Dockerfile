FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY back/package.json back/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY shared/ shared/
COPY back/ back/
RUN pnpm --filter back build

FROM base AS production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/back/node_modules ./back/node_modules
COPY --from=build /app/back/dist ./back/dist
COPY back/package.json back/
# Migration files and schema are required at runtime for prisma migrate deploy
COPY back/prisma ./back/prisma

EXPOSE 3001
# Run pending migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=back/prisma/schema.prisma && node back/dist/src/main"]
