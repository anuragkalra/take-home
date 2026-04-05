import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestHandler } from 'express';

type TestUser = {
  id: string;
  email: string;
  role: 'SPONSOR' | 'PUBLISHER';
  sponsorId?: string;
  publisherId?: string;
};

type CampaignRecord = {
  id: string;
  name: string;
  description?: string | null;
  budget: number;
  spent: number;
  cpmRate?: number | null;
  cpcRate?: number | null;
  startDate: Date;
  endDate: Date;
  targetCategories: string[];
  targetRegions: string[];
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  sponsorId: string;
  sponsor?: { id: string; name: string; logo?: string | null };
  creatives?: unknown[];
  placements?: unknown[];
  _count?: { creatives: number; placements: number };
};

type AdSlotRecord = {
  id: string;
  name: string;
  description?: string | null;
  type: 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'NEWSLETTER' | 'PODCAST';
  position?: string | null;
  width?: number | null;
  height?: number | null;
  basePrice: number;
  cpmFloor?: number | null;
  isAvailable: boolean;
  publisherId: string;
  publisher?: { id: string; name: string; category?: string | null; monthlyViews?: number };
  placements?: unknown[];
  _count?: { placements: number };
};

const testState = vi.hoisted(() => ({
  campaigns: [] as CampaignRecord[],
  adSlots: [] as AdSlotRecord[],
  healthOk: true,
}));

const prismaMock = vi.hoisted(() => ({
  campaign: {
    findMany: vi.fn(async ({ where }: { where?: { sponsorId?: string; status?: CampaignRecord['status'] } }) => {
      return testState.campaigns.filter(
        (campaign) =>
          (where?.sponsorId === undefined || campaign.sponsorId === where.sponsorId) &&
          (where?.status === undefined || campaign.status === where.status),
      );
    }),
    findFirst: vi.fn(
      async ({
        where,
      }: {
        where?: { id?: string; sponsorId?: string };
        select?: unknown;
        include?: unknown;
      }) => {
        return (
          testState.campaigns.find(
            (campaign) =>
              (where?.id === undefined || campaign.id === where.id) &&
              (where?.sponsorId === undefined || campaign.sponsorId === where.sponsorId),
          ) ?? null
        );
      },
    ),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const created: CampaignRecord = {
        id: `campaign-${testState.campaigns.length + 1}`,
        name: data.name as string,
        description: (data.description as string | null | undefined) ?? null,
        budget: Number(data.budget),
        spent: 0,
        cpmRate: (data.cpmRate as number | null | undefined) ?? null,
        cpcRate: (data.cpcRate as number | null | undefined) ?? null,
        startDate: data.startDate as Date,
        endDate: data.endDate as Date,
        targetCategories: (data.targetCategories as string[] | undefined) ?? [],
        targetRegions: (data.targetRegions as string[] | undefined) ?? [],
        status: 'DRAFT',
        sponsorId: data.sponsorId as string,
        sponsor: { id: data.sponsorId as string, name: 'Acme Sponsor' },
        creatives: [],
        placements: [],
        _count: { creatives: 0, placements: 0 },
      };

      testState.campaigns.push(created);
      return created;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const campaign = testState.campaigns.find((entry) => entry.id === where.id);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      Object.assign(campaign, data);
      return campaign;
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const index = testState.campaigns.findIndex((entry) => entry.id === where.id);
      if (index === -1) {
        throw new Error('Campaign not found');
      }

      const [deleted] = testState.campaigns.splice(index, 1);
      return deleted;
    }),
  },
  adSlot: {
    findMany: vi.fn(async ({ where }: { where?: { publisherId?: string; type?: AdSlotRecord['type']; isAvailable?: boolean } }) => {
      return testState.adSlots.filter(
        (adSlot) =>
          (where?.publisherId === undefined || adSlot.publisherId === where.publisherId) &&
          (where?.type === undefined || adSlot.type === where.type) &&
          (where?.isAvailable === undefined || adSlot.isAvailable === where.isAvailable),
      );
    }),
    findFirst: vi.fn(
      async ({
        where,
      }: {
        where?: { id?: string; publisherId?: string };
        select?: unknown;
        include?: unknown;
      }) => {
        return (
          testState.adSlots.find(
            (adSlot) =>
              (where?.id === undefined || adSlot.id === where.id) &&
              (where?.publisherId === undefined || adSlot.publisherId === where.publisherId),
          ) ?? null
        );
      },
    ),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      return testState.adSlots.find((adSlot) => adSlot.id === where.id) ?? null;
    }),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const created: AdSlotRecord = {
        id: `ad-slot-${testState.adSlots.length + 1}`,
        name: data.name as string,
        description: (data.description as string | null | undefined) ?? null,
        type: data.type as AdSlotRecord['type'],
        position: (data.position as string | null | undefined) ?? null,
        width: (data.width as number | null | undefined) ?? null,
        height: (data.height as number | null | undefined) ?? null,
        basePrice: Number(data.basePrice),
        cpmFloor: (data.cpmFloor as number | null | undefined) ?? null,
        isAvailable: (data.isAvailable as boolean | undefined) ?? true,
        publisherId: data.publisherId as string,
        publisher: { id: data.publisherId as string, name: 'Publisher One' },
        placements: [],
        _count: { placements: 0 },
      };

      testState.adSlots.push(created);
      return created;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const adSlot = testState.adSlots.find((entry) => entry.id === where.id);
      if (!adSlot) {
        throw new Error('Ad slot not found');
      }

      Object.assign(adSlot, data);
      return adSlot;
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const index = testState.adSlots.findIndex((entry) => entry.id === where.id);
      if (index === -1) {
        throw new Error('Ad slot not found');
      }

      const [deleted] = testState.adSlots.splice(index, 1);
      return deleted;
    }),
  },
  $queryRaw: vi.fn(async () => {
    if (!testState.healthOk) {
      throw new Error('database down');
    }

    return [{ '?column?': 1 }];
  }),
}));

vi.mock('./db.js', () => ({
  prisma: prismaMock,
}));

vi.mock('./auth.js', () => {
  const authMiddleware: RequestHandler = (req, res, next) => {
    const authReq = req as typeof req & { user?: TestUser };
    const rawUser = req.headers['x-test-user'];
    if (typeof rawUser !== 'string') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    authReq.user = JSON.parse(rawUser) as TestUser;
    next();
  };

  return {
    authMiddleware,
    roleMiddleware:
      (allowedRoles: Array<'SPONSOR' | 'PUBLISHER'>): RequestHandler =>
      (req, res, next) => {
        const user = (req as typeof req & { user?: TestUser }).user;
        if (!user || !allowedRoles.includes(user.role)) {
          res.status(403).json({ error: 'Insufficient permissions' });
          return;
        }

        next();
      },
  };
});

type TestResponse = {
  statusCode: number;
  body: unknown;
};

type RouteLike = {
  stack: Array<{
    route?: {
      path: string;
      methods?: Record<string, boolean>;
      stack: Array<{ handle: RequestHandler }>;
    };
  }>;
};

let campaignsRoutes: RouteLike;
let adSlotsRoutes: RouteLike;
let healthRoutes: RouteLike;

const sponsorUser: TestUser = {
  id: 'user-sponsor-1',
  email: 'sponsor@example.com',
  role: 'SPONSOR',
  sponsorId: 'sponsor-1',
};

const otherSponsorUser: TestUser = {
  id: 'user-sponsor-2',
  email: 'other-sponsor@example.com',
  role: 'SPONSOR',
  sponsorId: 'sponsor-2',
};

const publisherUser: TestUser = {
  id: 'user-publisher-1',
  email: 'publisher@example.com',
  role: 'PUBLISHER',
  publisherId: 'publisher-1',
};

const otherPublisherUser: TestUser = {
  id: 'user-publisher-2',
  email: 'other-publisher@example.com',
  role: 'PUBLISHER',
  publisherId: 'publisher-2',
};

function matchRoute(routePath: string, requestPath: string): { matched: boolean; params: Record<string, string> } {
  if (routePath === requestPath) {
    return { matched: true, params: {} };
  }

  const routeParts = routePath.split('/').filter(Boolean);
  const requestParts = requestPath.split('/').filter(Boolean);
  if (routeParts.length !== requestParts.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < routeParts.length; index += 1) {
    const routePart = routeParts[index];
    const requestPart = requestParts[index];

    if (routePart.startsWith(':')) {
      params[routePart.slice(1)] = requestPart;
      continue;
    }

    if (routePart !== requestPart) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}

async function request(
  router: RouteLike,
  path: string,
  init: { method?: string; body?: unknown; query?: Record<string, string> } = {},
  user?: TestUser,
): Promise<TestResponse> {
  const method = (init.method ?? 'GET').toLowerCase();
  const layer = router.stack.find((entry) => {
    if (!entry.route?.methods?.[method]) {
      return false;
    }

    return matchRoute(entry.route.path, path).matched;
  });

  if (!layer?.route) {
    throw new Error(`Route not found for ${method.toUpperCase()} ${path}`);
  }

  const { params } = matchRoute(layer.route.path, path);

  return new Promise<TestResponse>((resolve, reject) => {
    let resolved = false;

    const res = {
      statusCode: 200,
      body: undefined as unknown,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: unknown) {
        this.body = payload;
        resolved = true;
        resolve({ statusCode: this.statusCode, body: payload });
        return this;
      },
      send(payload?: unknown) {
        this.body = payload;
        resolved = true;
        resolve({ statusCode: this.statusCode, body: payload });
        return this;
      },
      end(payload?: unknown) {
        this.body = payload;
        resolved = true;
        resolve({ statusCode: this.statusCode, body: payload });
        return this;
      },
    };

    const req = {
      method: method.toUpperCase(),
      path,
      url: path,
      originalUrl: path,
      params,
      query: init.query ?? {},
      body: init.body,
      headers: user ? { 'x-test-user': JSON.stringify(user) } : {},
    };

    const route = layer.route;
    if (!route) {
      reject(new Error(`Route not found for ${method.toUpperCase()} ${path}`));
      return;
    }

    const handlers = route.stack.map((entry) => entry.handle);
    let index = 0;

    const next = (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }

      const handler = handlers[index];
      index += 1;

      if (!handler) {
        if (!resolved) {
          resolve({ statusCode: res.statusCode, body: res.body });
        }
        return;
      }

      Promise.resolve(handler(req as never, res as never, next)).catch(reject);
    };

    next();
  });
}

beforeAll(async () => {
  const [campaignsModule, adSlotsModule, healthModule] = await Promise.all([
    import('./routes/campaigns.js'),
    import('./routes/adSlots.js'),
    import('./routes/health.js'),
  ]);

  campaignsRoutes = campaignsModule.default as unknown as RouteLike;
  adSlotsRoutes = adSlotsModule.default as unknown as RouteLike;
  healthRoutes = healthModule.default as unknown as RouteLike;
});

afterAll(() => {});

beforeEach(() => {
  testState.healthOk = true;
  testState.campaigns = [
    {
      id: 'campaign-1',
      name: 'Launch Campaign',
      description: 'Initial sponsor campaign',
      budget: 5000,
      spent: 200,
      cpmRate: 12,
      cpcRate: 2,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T00:00:00.000Z'),
      targetCategories: ['tech'],
      targetRegions: ['US'],
      status: 'ACTIVE',
      sponsorId: 'sponsor-1',
      sponsor: { id: 'sponsor-1', name: 'Acme Sponsor', logo: null },
      creatives: [],
      placements: [],
      _count: { creatives: 0, placements: 0 },
    },
  ];

  testState.adSlots = [
    {
      id: 'ad-slot-1',
      name: 'Homepage Banner',
      description: 'Top of page placement',
      type: 'DISPLAY',
      position: 'TOP',
      width: 728,
      height: 90,
      basePrice: 250,
      cpmFloor: 10,
      isAvailable: true,
      publisherId: 'publisher-1',
      publisher: { id: 'publisher-1', name: 'Publisher One', category: 'News', monthlyViews: 100000 },
      placements: [],
      _count: { placements: 0 },
    },
  ];

  vi.clearAllMocks();
});

describe('Campaign API', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const response = await request(campaignsRoutes, '/');

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns a single owned campaign by ID', async () => {
    const response = await request(campaignsRoutes, '/campaign-1', {}, sponsorUser);

    expect(response.statusCode).toBe(200);
    const campaign = response.body as CampaignRecord;
    expect(campaign.id).toBe('campaign-1');
    expect(campaign.name).toBe('Launch Campaign');
  });

  it('returns 404 when the campaign is not owned by the caller', async () => {
    const response = await request(campaignsRoutes, '/campaign-1', {}, otherSponsorUser);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Campaign not found' });
  });

  it('creates a campaign for the authenticated sponsor', async () => {
    const response = await request(
      campaignsRoutes,
      '/',
      {
        method: 'POST',
        body: {
          name: 'Summer Push',
          budget: 9000,
          startDate: '2026-05-01T00:00:00.000Z',
          endDate: '2026-05-31T00:00:00.000Z',
          targetCategories: ['business'],
        },
      },
      sponsorUser,
    );

    expect(response.statusCode).toBe(201);
    const created = response.body as CampaignRecord;
    expect(created.name).toBe('Summer Push');
    expect(created.sponsorId).toBe('sponsor-1');
    expect(testState.campaigns).toHaveLength(2);
  });

  it('returns 400 for invalid campaign payloads', async () => {
    const response = await request(
      campaignsRoutes,
      '/',
      {
        method: 'POST',
        body: {
          name: '',
          budget: 1000,
          startDate: '2026-05-10T00:00:00.000Z',
          endDate: '2026-05-01T00:00:00.000Z',
        },
      },
      sponsorUser,
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'name is required' });
  });

  it('updates an existing campaign', async () => {
    const response = await request(
      campaignsRoutes,
      '/campaign-1',
      {
        method: 'PUT',
        body: {
          name: 'Updated Campaign',
          budget: 7500,
        },
      },
      sponsorUser,
    );

    expect(response.statusCode).toBe(200);
    const updated = response.body as CampaignRecord;
    expect(updated.name).toBe('Updated Campaign');
    expect(updated.budget).toBe(7500);
  });

  it('deletes an existing campaign', async () => {
    const response = await request(campaignsRoutes, '/campaign-1', { method: 'DELETE' }, sponsorUser);

    expect(response.statusCode).toBe(204);
    expect(testState.campaigns).toHaveLength(0);
  });
});

describe('Ad Slots API', () => {
  it('creates an ad slot for the authenticated publisher', async () => {
    const response = await request(
      adSlotsRoutes,
      '/',
      {
        method: 'POST',
        body: {
          name: 'Newsletter Slot',
          type: 'NEWSLETTER',
          basePrice: 450,
          width: 600,
          height: 200,
        },
      },
      publisherUser,
    );

    expect(response.statusCode).toBe(201);
    const created = response.body as AdSlotRecord;
    expect(created.publisherId).toBe('publisher-1');
    expect(created.type).toBe('NEWSLETTER');
  });

  it('returns 403 when the caller has the wrong role for ad-slot creation', async () => {
    const response = await request(
      adSlotsRoutes,
      '/',
      {
        method: 'POST',
        body: {
          name: 'Banner',
          type: 'DISPLAY',
          basePrice: 100,
        },
      },
      sponsorUser,
    );

    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({ error: 'Insufficient permissions' });
  });

  it('returns a single ad slot for the owner', async () => {
    const response = await request(adSlotsRoutes, '/ad-slot-1', {}, publisherUser);

    expect(response.statusCode).toBe(200);
    const adSlot = response.body as AdSlotRecord;
    expect(adSlot.id).toBe('ad-slot-1');
    expect(adSlot.name).toBe('Homepage Banner');
  });

  it('returns 404 when the ad slot is not owned by the publisher', async () => {
    const response = await request(adSlotsRoutes, '/ad-slot-1', {}, otherPublisherUser);

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Ad slot not found' });
  });

  it('updates an existing ad slot', async () => {
    const response = await request(
      adSlotsRoutes,
      '/ad-slot-1',
      {
        method: 'PUT',
        body: {
          basePrice: 325,
          isAvailable: false,
        },
      },
      publisherUser,
    );

    expect(response.statusCode).toBe(200);
    const updated = response.body as AdSlotRecord;
    expect(updated.basePrice).toBe(325);
    expect(updated.isAvailable).toBe(false);
  });

  it('deletes an existing ad slot', async () => {
    const response = await request(adSlotsRoutes, '/ad-slot-1', { method: 'DELETE' }, publisherUser);

    expect(response.statusCode).toBe(204);
    expect(testState.adSlots).toHaveLength(0);
  });
});

describe('Health API', () => {
  it('returns health status when the database is reachable', async () => {
    const response = await request(healthRoutes, '/');

    expect(response.statusCode).toBe(200);
    const payload = response.body as { status: string; database: string };
    expect(payload.status).toBe('ok');
    expect(payload.database).toBe('connected');
  });

  it('returns 503 when the database is unavailable', async () => {
    testState.healthOk = false;

    const response = await request(healthRoutes, '/');

    expect(response.statusCode).toBe(503);
    const payload = response.body as { status: string; database: string };
    expect(payload.status).toBe('error');
    expect(payload.database).toBe('disconnected');
  });
});
