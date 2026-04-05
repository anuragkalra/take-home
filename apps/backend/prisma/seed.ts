// Seed script for populating the database with sample data
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the PostgreSQL driver adapter for Prisma 7
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function createBetterAuthTables(client: pg.PoolClient) {
  console.log('Creating Better Auth tables...');

  // Create user table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create session table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      "expiresAt" TIMESTAMP NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create account table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "accessTokenExpiresAt" TIMESTAMP,
      "refreshTokenExpiresAt" TIMESTAMP,
      password TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create verification table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  console.log('  ✓ Better Auth tables created');
}

async function seedBetterAuthUsers() {
  console.log('Seeding Better Auth users...');

  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    // Create tables first (if they don't exist)
    await createBetterAuthTables(client);

    // Clean existing auth data
    await client.query('DELETE FROM "session"');
    await client.query('DELETE FROM "account"');
    await client.query('DELETE FROM "verification"');
    await client.query('DELETE FROM "user"');

    const now = new Date().toISOString();
    const hashedPassword = await hashPassword('password');

    // Create sponsor user with a fixed ID so we can link it
    const sponsorUserId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [sponsorUserId, 'Demo Sponsor', 'sponsor@example.com', true, null, now, now]
    );

    await client.query(
      `INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [crypto.randomUUID(), sponsorUserId, sponsorUserId, 'credential', hashedPassword, now, now]
    );
    console.log('  ✓ Created sponsor user: sponsor@example.com / password');

    // Create publisher user with a fixed ID so we can link it
    const publisherUserId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [publisherUserId, 'Demo Publisher', 'publisher@example.com', true, null, now, now]
    );

    await client.query(
      `INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        publisherUserId,
        publisherUserId,
        'credential',
        hashedPassword,
        now,
        now,
      ]
    );
    console.log('  ✓ Created publisher user: publisher@example.com / password');

    return { sponsorUserId, publisherUserId };
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  console.log('Seeding database...\n');

  // Seed Better Auth users first and get their IDs
  const { sponsorUserId, publisherUserId } = await seedBetterAuthUsers();

  // Clean existing Prisma data (not Better Auth tables)
  console.log('\nSeeding Prisma models...');
  await prisma.placement.deleteMany();
  await prisma.creative.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.adSlot.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.publisher.deleteMany();

  // Create sponsor linked to the demo sponsor user
  const acme = await prisma.sponsor.create({
    data: {
      userId: sponsorUserId, // Link to Better Auth user
      name: 'Acme Corp',
      email: 'sponsor@example.com', // Match the auth email
      website: 'https://acme.com',
      industry: 'Technology',
      subscriptionTier: 'PROFESSIONAL',
      isVerified: true,
    },
  });

  const techStartup = await prisma.sponsor.create({
    data: {
      name: 'TechStartup Inc',
      email: 'ads@techstartup.io',
      industry: 'SaaS',
      subscriptionTier: 'STARTER',
    },
  });

  // Create publisher linked to the demo publisher user
  const devBlog = await prisma.publisher.create({
    data: {
      userId: publisherUserId, // Link to Better Auth user
      name: 'Dev Blog Daily',
      email: 'publisher@example.com', // Match the auth email
      website: 'https://devblog.com',
      category: 'Technology',
      monthlyViews: 100000,
      subscriberCount: 15000,
      isVerified: true,
    },
  });

  const podcastShow = await prisma.publisher.create({
    data: {
      name: 'Code Talk Podcast',
      email: 'ads@codetalk.fm',
      website: 'https://codetalk.fm',
      category: 'Podcast',
      monthlyViews: 50000,
      subscriberCount: 8000,
    },
  });

  // Create additional publishers for variety
  const newsletterPub = await prisma.publisher.create({
    data: {
      name: 'Tech Weekly Newsletter',
      email: 'ads@techweekly.io',
      website: 'https://techweekly.io',
      category: 'Newsletter',
      monthlyViews: 75000,
      subscriberCount: 25000,
      isVerified: true,
    },
  });

  const videoChannel = await prisma.publisher.create({
    data: {
      name: 'CodeTube',
      email: 'sponsors@codetube.dev',
      website: 'https://codetube.dev',
      category: 'Video',
      monthlyViews: 500000,
      subscriberCount: 120000,
      isVerified: true,
    },
  });

  const startupBlog = await prisma.publisher.create({
    data: {
      name: 'Startup Insider',
      email: 'ads@startupinsider.co',
      website: 'https://startupinsider.co',
      category: 'Business',
      monthlyViews: 200000,
      subscriberCount: 45000,
    },
  });

  // Create 20 ad slots with variety
  const adSlots = [
    // Dev Blog Daily slots
    {
      name: 'Header Banner',
      description:
        'Premium top-of-page banner placement with maximum visibility. Appears on all pages.',
      type: 'DISPLAY',
      position: 'header',
      width: 728,
      height: 90,
      basePrice: 500,
      publisherId: devBlog.id,
      isAvailable: true,
    },
    {
      name: 'Sidebar Ad',
      description: 'Right sidebar placement, sticky on scroll. Great for sustained visibility.',
      type: 'DISPLAY',
      position: 'sidebar',
      width: 300,
      height: 250,
      basePrice: 300,
      publisherId: devBlog.id,
      isAvailable: true,
    },
    {
      name: 'In-Article Native Ad',
      description: 'Native ad placement within article content. Blends with editorial style.',
      type: 'DISPLAY',
      position: 'in-content',
      width: 600,
      height: 400,
      basePrice: 450,
      publisherId: devBlog.id,
      isAvailable: false, // Already booked
    },
    {
      name: 'Footer Banner',
      description: 'End-of-page banner. Lower visibility but budget-friendly option.',
      type: 'DISPLAY',
      position: 'footer',
      width: 728,
      height: 90,
      basePrice: 150,
      publisherId: devBlog.id,
      isAvailable: true,
    },
    // Code Talk Podcast slots
    {
      name: 'Pre-roll Spot (60s)',
      description: '60-second pre-roll sponsorship. Host-read with personal endorsement.',
      type: 'PODCAST',
      position: 'pre-roll',
      basePrice: 1000,
      publisherId: podcastShow.id,
      isAvailable: true,
    },
    {
      name: 'Mid-roll Spot (90s)',
      description: '90-second mid-roll placement. Highest engagement rates.',
      type: 'PODCAST',
      position: 'mid-roll',
      basePrice: 1500,
      publisherId: podcastShow.id,
      isAvailable: true,
    },
    {
      name: 'Post-roll Mention (30s)',
      description: 'Brief 30-second mention at episode end. Budget-friendly podcast option.',
      type: 'PODCAST',
      position: 'post-roll',
      basePrice: 400,
      publisherId: podcastShow.id,
      isAvailable: true,
    },
    // Tech Weekly Newsletter slots
    {
      name: 'Featured Sponsor Slot',
      description:
        'Top placement in newsletter. Includes logo, headline, and 100-word description.',
      type: 'NEWSLETTER',
      position: 'featured',
      basePrice: 800,
      publisherId: newsletterPub.id,
      isAvailable: false, // Already booked
    },
    {
      name: 'Classified Ad',
      description: 'Text-only classified listing. Great for job postings and announcements.',
      type: 'NEWSLETTER',
      position: 'classified',
      basePrice: 200,
      publisherId: newsletterPub.id,
      isAvailable: true,
    },
    {
      name: 'Dedicated Email Send',
      description: 'Full dedicated email to our 25K subscriber list. Your message only.',
      type: 'NEWSLETTER',
      position: 'dedicated',
      basePrice: 2500,
      publisherId: newsletterPub.id,
      isAvailable: true,
    },
    {
      name: 'Newsletter Footer',
      description: 'Persistent footer placement in every issue. Logo and short tagline.',
      type: 'NEWSLETTER',
      position: 'footer',
      basePrice: 350,
      publisherId: newsletterPub.id,
      isAvailable: true,
    },
    // CodeTube Video slots
    {
      name: 'Pre-roll Video Ad (15s)',
      description: '15-second skippable pre-roll video ad. Reaches 500K monthly viewers.',
      type: 'VIDEO',
      position: 'pre-roll',
      basePrice: 2000,
      publisherId: videoChannel.id,
      isAvailable: true,
    },
    {
      name: 'Pre-roll Video Ad (30s)',
      description: '30-second non-skippable pre-roll. Premium placement with guaranteed views.',
      type: 'VIDEO',
      position: 'pre-roll',
      basePrice: 3500,
      publisherId: videoChannel.id,
      isAvailable: false, // Already booked
    },
    {
      name: 'Sponsored Integration',
      description: 'In-video sponsored segment (2-3 min). Host demonstrates your product.',
      type: 'VIDEO',
      position: 'integration',
      basePrice: 5000,
      publisherId: videoChannel.id,
      isAvailable: true,
    },
    {
      name: 'End Card Placement',
      description: 'Clickable end card with your branding. Appears in last 20 seconds.',
      type: 'VIDEO',
      position: 'end-card',
      basePrice: 750,
      publisherId: videoChannel.id,
      isAvailable: true,
    },
    {
      name: 'Video Description Link',
      description: 'Prominent link in video description with tracking. All videos for 1 month.',
      type: 'VIDEO',
      position: 'description',
      basePrice: 400,
      publisherId: videoChannel.id,
      isAvailable: true,
    },
    // Startup Insider slots
    {
      name: 'Homepage Takeover',
      description: 'Full homepage takeover for 24 hours. Maximum brand exposure.',
      type: 'DISPLAY',
      position: 'takeover',
      width: 1200,
      height: 600,
      basePrice: 3000,
      publisherId: startupBlog.id,
      isAvailable: true,
    },
    {
      name: 'Sponsored Article',
      description:
        'Native sponsored content piece. Written by our editorial team about your product.',
      type: 'DISPLAY',
      position: 'sponsored-content',
      basePrice: 1500,
      publisherId: startupBlog.id,
      isAvailable: true,
    },
    {
      name: 'Leaderboard Ad',
      description: 'Standard leaderboard placement above the fold. Rotates with other sponsors.',
      type: 'DISPLAY',
      position: 'leaderboard',
      width: 970,
      height: 250,
      basePrice: 600,
      publisherId: startupBlog.id,
      isAvailable: true,
    },
    {
      name: 'Mobile Interstitial',
      description: 'Full-screen mobile interstitial. Shows once per user session.',
      type: 'DISPLAY',
      position: 'interstitial',
      width: 320,
      height: 480,
      basePrice: 400,
      publisherId: startupBlog.id,
      isAvailable: false, // Already booked
    },
  ];

  for (const slot of adSlots) {
    await prisma.adSlot.create({ data: slot });
  }

  // Create campaigns for the logged-in demo sponsor (Acme Corp)
  const campaigns = [
    {
      name: 'Q2 Product Launch Sponsorship',
      description:
        'Promote our spring product launch across premium technology publisher inventory.',
      budget: 12000,
      spent: 3200,
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-05-10'),
      status: 'ACTIVE',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'CA'],
      sponsorId: acme.id,
    },
    {
      name: 'Developer Tools Awareness Campaign',
      description:
        'Drive awareness for our developer platform among engineering managers and technical buyers.',
      budget: 8500,
      spent: 0,
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-05-06'),
      status: 'DRAFT',
      targetCategories: ['Technology'],
      targetRegions: ['US', 'UK'],
      sponsorId: acme.id,
    },
    {
      name: 'Fintech Brand Trust Initiative',
      description:
        'Build credibility with finance and payments audiences through premium sponsorship placements.',
      budget: 15000,
      spent: 5400,
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-05-05'),
      status: 'ACTIVE',
      targetCategories: ['Finance', 'Business'],
      targetRegions: ['US', 'UK', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Remote Work Software Push',
      description:
        'Target remote-first teams and operations leads with sponsored placements highlighting workflow automation.',
      budget: 6800,
      spent: 0,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-21'),
      status: 'DRAFT',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'Remote'],
      sponsorId: acme.id,
    },
    {
      name: 'Startup Founder Acquisition Sprint',
      description:
        'Acquire early-stage founders and operators through startup media placements and newsletter sponsorships.',
      budget: 9300,
      spent: 4100,
      startDate: new Date('2026-04-05'),
      endDate: new Date('2026-04-30'),
      status: 'ACTIVE',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'CA', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'AI Analytics Platform Campaign',
      description:
        'Generate qualified leads for our AI analytics suite from product, data, and engineering teams.',
      budget: 17500,
      spent: 0,
      startDate: new Date('2026-05-10'),
      endDate: new Date('2026-06-10'),
      status: 'DRAFT',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'UK'],
      sponsorId: acme.id,
    },
    {
      name: 'SMB Payments Expansion Campaign',
      description: 'Promote our SMB payments product to finance managers and ecommerce operators.',
      budget: 7400,
      spent: 2800,
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-28'),
      status: 'ACTIVE',
      targetCategories: ['Finance', 'Business'],
      targetRegions: ['US'],
      sponsorId: acme.id,
    },
    {
      name: 'Cybersecurity Awareness Series',
      description:
        'Increase pipeline from IT and security leaders through targeted digital sponsorship placements.',
      budget: 13250,
      spent: 0,
      startDate: new Date('2026-05-12'),
      endDate: new Date('2026-06-08'),
      status: 'DRAFT',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'CA', 'UK'],
      sponsorId: acme.id,
    },
    {
      name: 'Enterprise SaaS Consideration Campaign',
      description:
        'Move enterprise buyers from awareness to consideration with high-visibility placements on B2B media properties.',
      budget: 22000,
      spent: 9600,
      startDate: new Date('2026-03-15'),
      endDate: new Date('2026-05-15'),
      status: 'ACTIVE',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Marketing Ops Lead Gen Burst',
      description:
        'Capture marketing operations and RevOps leads through newsletter and display inventory.',
      budget: 9900,
      spent: 0,
      startDate: new Date('2026-05-05'),
      endDate: new Date('2026-05-29'),
      status: 'DRAFT',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'CA'],
      sponsorId: acme.id,
    },
    {
      name: 'Cloud Infrastructure Buyer Campaign',
      description:
        'Reach engineering managers and infrastructure buyers with reliability and cost-efficiency messaging.',
      budget: 16400,
      spent: 7200,
      startDate: new Date('2026-04-02'),
      endDate: new Date('2026-05-02'),
      status: 'ACTIVE',
      targetCategories: ['Technology'],
      targetRegions: ['US', 'UK', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Founder Newsletter Sponsorship Test',
      description:
        'Run an experimental campaign across founder newsletters to evaluate CTR and qualified sign-up performance.',
      budget: 4200,
      spent: 1100,
      startDate: new Date('2026-04-08'),
      endDate: new Date('2026-04-22'),
      status: 'ACTIVE',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US'],
      sponsorId: acme.id,
    },
    {
      name: 'Spring Brand Awareness Push',
      description:
        'Broaden top-of-funnel awareness across startup, engineering, and business audiences.',
      budget: 11500,
      spent: 3500,
      startDate: new Date('2026-03-28'),
      endDate: new Date('2026-04-30'),
      status: 'ACTIVE',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'CA'],
      sponsorId: acme.id,
    },
    {
      name: 'B2B Buyer Intent Campaign',
      description:
        'Target high-intent B2B software buyers across niche publications and sponsorship packages.',
      budget: 14000,
      spent: 0,
      startDate: new Date('2026-05-03'),
      endDate: new Date('2026-06-03'),
      status: 'DRAFT',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'UK'],
      sponsorId: acme.id,
    },
    {
      name: 'Payments Product Education Campaign',
      description:
        'Educate finance teams on product capabilities through sponsored content and newsletter placements.',
      budget: 8800,
      spent: 3000,
      startDate: new Date('2026-04-04'),
      endDate: new Date('2026-04-29'),
      status: 'ACTIVE',
      targetCategories: ['Finance', 'Business'],
      targetRegions: ['US', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Revenue Operations Audience Test',
      description:
        'Test creative and messaging performance with operations and RevOps-focused audiences.',
      budget: 6100,
      spent: 0,
      startDate: new Date('2026-05-14'),
      endDate: new Date('2026-06-01'),
      status: 'DRAFT',
      targetCategories: ['Business'],
      targetRegions: ['US'],
      sponsorId: acme.id,
    },
    {
      name: 'Scale-Up Hiring Brand Campaign',
      description:
        'Increase visibility among scale-up operators and hiring managers ahead of a recruiting push.',
      budget: 7600,
      spent: 2400,
      startDate: new Date('2026-04-06'),
      endDate: new Date('2026-04-26'),
      status: 'ACTIVE',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'CA'],
      sponsorId: acme.id,
    },
    {
      name: 'Summer Pipeline Generation Campaign',
      description:
        'Build pipeline for Q3 with a multi-channel sponsorship plan spanning display, newsletter, and native placements.',
      budget: 19500,
      spent: 0,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-07-01'),
      status: 'DRAFT',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'UK', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Productivity Suite Awareness',
      description:
        'Drive awareness for our productivity offering among operations teams and knowledge workers.',
      budget: 7100,
      spent: 1800,
      startDate: new Date('2026-04-03'),
      endDate: new Date('2026-04-24'),
      status: 'ACTIVE',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'Remote'],
      sponsorId: acme.id,
    },
    {
      name: 'Newsletter Performance Benchmark Test',
      description:
        'Compare click-through and conversion rates across multiple newsletter publisher partners.',
      budget: 5300,
      spent: 0,
      startDate: new Date('2026-05-08'),
      endDate: new Date('2026-05-23'),
      status: 'DRAFT',
      targetCategories: ['Business'],
      targetRegions: ['US', 'CA'],
      sponsorId: acme.id,
    },
    {
      name: 'Mid-Market Growth Campaign',
      description:
        'Target mid-market operators with a mix of display and sponsorship placements on business-focused publications.',
      budget: 13400,
      spent: 6200,
      startDate: new Date('2026-03-22'),
      endDate: new Date('2026-05-01'),
      status: 'ACTIVE',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Brand Recall Video Sponsorships',
      description:
        'Test premium video inventory to improve brand recall with technical and startup audiences.',
      budget: 15800,
      spent: 0,
      startDate: new Date('2026-05-18'),
      endDate: new Date('2026-06-18'),
      status: 'DRAFT',
      targetCategories: ['Technology'],
      targetRegions: ['US', 'UK'],
      sponsorId: acme.id,
    },
    {
      name: 'Quarter-End Conversion Push',
      description:
        'Focus spend on conversion-oriented inventory at the end of quarter to maximize sign-ups.',
      budget: 10200,
      spent: 4700,
      startDate: new Date('2026-04-07'),
      endDate: new Date('2026-04-30'),
      status: 'ACTIVE',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US'],
      sponsorId: acme.id,
    },
    {
      name: 'Podcast Sponsorship Pilot',
      description:
        'Evaluate podcast host-read sponsorships as a channel for founder and developer audience growth.',
      budget: 6900,
      spent: 0,
      startDate: new Date('2026-05-20'),
      endDate: new Date('2026-06-10'),
      status: 'DRAFT',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'CA'],
      sponsorId: acme.id,
    },
    {
      name: 'DevOps Buyer Education Series',
      description:
        'Promote educational content and product messaging to DevOps and platform engineering teams.',
      budget: 14300,
      spent: 5100,
      startDate: new Date('2026-03-30'),
      endDate: new Date('2026-05-03'),
      status: 'ACTIVE',
      targetCategories: ['Technology'],
      targetRegions: ['US', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Executive Audience Reach Campaign',
      description:
        'Reach decision-makers through premium placements on executive and business-focused media properties.',
      budget: 18200,
      spent: 0,
      startDate: new Date('2026-05-22'),
      endDate: new Date('2026-06-22'),
      status: 'DRAFT',
      targetCategories: ['Business', 'Finance'],
      targetRegions: ['US', 'UK'],
      sponsorId: acme.id,
    },
    {
      name: 'Referral Program Awareness Push',
      description:
        'Promote our new referral program through low-cost, broad-reach placements across startup audiences.',
      budget: 4800,
      spent: 1600,
      startDate: new Date('2026-04-09'),
      endDate: new Date('2026-04-25'),
      status: 'ACTIVE',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US'],
      sponsorId: acme.id,
    },
    {
      name: 'Regional Expansion UK Campaign',
      description:
        'Support UK market expansion with localized publisher partnerships and sponsorship messaging.',
      budget: 9700,
      spent: 0,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-05-31'),
      status: 'DRAFT',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['UK'],
      sponsorId: acme.id,
    },
    {
      name: 'FinOps Awareness Initiative',
      description:
        'Reach finance and infrastructure teams with messaging around spend visibility and operational efficiency.',
      budget: 12100,
      spent: 4300,
      startDate: new Date('2026-04-11'),
      endDate: new Date('2026-05-09'),
      status: 'ACTIVE',
      targetCategories: ['Finance', 'Technology'],
      targetRegions: ['US', 'EU'],
      sponsorId: acme.id,
    },
    {
      name: 'Growth Team Creative Experiment',
      description:
        'Run a structured creative test across several publisher channels to identify top-performing messaging.',
      budget: 5600,
      spent: 0,
      startDate: new Date('2026-05-25'),
      endDate: new Date('2026-06-12'),
      status: 'DRAFT',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'CA'],
      sponsorId: acme.id,
    },
    {
      name: 'Pipeline Acceleration Campaign',
      description:
        'Increase late-stage pipeline by focusing spend on high-conversion sponsorship inventory.',
      budget: 12800,
      spent: 5800,
      startDate: new Date('2026-04-12'),
      endDate: new Date('2026-05-08'),
      status: 'ACTIVE',
      targetCategories: ['Technology', 'Business'],
      targetRegions: ['US', 'UK'],
      sponsorId: acme.id,
    },
    {
      name: 'Customer Story Distribution Campaign',
      description:
        'Distribute customer success stories through sponsored content and newsletter placements.',
      budget: 8600,
      spent: 0,
      startDate: new Date('2026-05-16'),
      endDate: new Date('2026-06-06'),
      status: 'DRAFT',
      targetCategories: ['Business', 'Technology'],
      targetRegions: ['US', 'EU'],
      sponsorId: acme.id,
    },
  ];

  for (const campaign of campaigns) {
    await prisma.campaign.create({ data: campaign });
  }

  console.log('\nPrisma seed completed!');
  console.log('  Created: 2 sponsors, 5 publishers, 20 ad slots, 30 campaigns');

  console.log('\n✅ All seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
