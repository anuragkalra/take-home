import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'path';

// Load env from monorepo root
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '../../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx --env-file=../../.env prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
