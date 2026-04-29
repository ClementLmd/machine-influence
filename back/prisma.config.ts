import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    // directUrl bypasses pgBouncer — required for prisma migrate dev (shadow DB creation)
    // At runtime the app uses DATABASE_URL (session pooler) via PrismaService
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});
