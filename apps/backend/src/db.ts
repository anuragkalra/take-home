import {
  PrismaClient,
  type Sponsor,
  type Publisher,
  type Campaign,
  type Creative,
  type AdSlot,
  type Placement,
  type Payment,
  SubscriptionTier,
  CampaignStatus,
  CreativeType,
  AdSlotType,
  PricingModel,
  PlacementStatus,
  PaymentType,
  PaymentStatus,
} from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// Create the PostgreSQL driver adapter for Prisma 7
// Env is loaded via --env-file flag in package.json scripts
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

// Singleton Prisma client instance
// In development, prevent multiple instances due to hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export types for use in API routes
export type { Sponsor, Publisher, Campaign, Creative, AdSlot, Placement, Payment };

export {
  SubscriptionTier,
  CampaignStatus,
  CreativeType,
  AdSlotType,
  PricingModel,
  PlacementStatus,
  PaymentType,
  PaymentStatus,
};
