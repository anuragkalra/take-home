import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { authMiddleware, roleMiddleware, type AuthRequest } from '../auth.js';

const router: IRouter = Router();

const requireSponsor = [authMiddleware, roleMiddleware(['SPONSOR'])];
const CAMPAIGN_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] as const;

type CampaignPayload = {
  name?: string;
  description?: string | null;
  budget?: number;
  cpmRate?: number | null;
  cpcRate?: number | null;
  startDate?: Date;
  endDate?: Date;
  targetCategories?: string[];
  targetRegions?: string[];
  status?: (typeof CAMPAIGN_STATUSES)[number];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRequiredString(value: unknown, field: string): { value?: string; error?: string } {
  if (typeof value !== 'string' || value.trim() === '') {
    return { error: `${field} is required` };
  }

  return { value: value.trim() };
}

function parseOptionalString(
  value: unknown,
  field: string,
  options: { nullable?: boolean } = {},
): { value?: string | null; error?: string } {
  if (value === undefined) {
    return {};
  }

  if (value === null) {
    if (options.nullable) return { value: null };
    return { error: `${field} must be a string` };
  }

  if (typeof value !== 'string') {
    return { error: `${field} must be a string` };
  }

  return { value: value.trim() };
}

function parseOptionalNumber(
  value: unknown,
  field: string,
  options: { required?: boolean; nullable?: boolean; min?: number } = {},
): { value?: number | null; error?: string } {
  if (value === undefined) {
    return options.required ? { error: `${field} is required` } : {};
  }

  if (value === null) {
    if (options.nullable) return { value: null };
    return { error: `${field} must be a number` };
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return { error: `${field} must be a valid number` };
  }

  if (options.min !== undefined && parsed < options.min) {
    return { error: `${field} must be at least ${options.min}` };
  }

  return { value: parsed };
}

function parseOptionalDate(
  value: unknown,
  field: string,
  options: { required?: boolean } = {},
): { value?: Date; error?: string } {
  if (value === undefined) {
    return options.required ? { error: `${field} is required` } : {};
  }

  if (typeof value !== 'string' && !(value instanceof Date)) {
    return { error: `${field} must be a valid date` };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { error: `${field} must be a valid date` };
  }

  return { value: parsed };
}

function parseOptionalStringArray(value: unknown, field: string): { value?: string[]; error?: string } {
  if (value === undefined) {
    return {};
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return { error: `${field} must be an array of strings` };
  }

  return { value: value.map((item) => item.trim()) };
}

function validateCampaignPayload(body: unknown, partial = false): { data?: CampaignPayload; error?: string } {
  if (!isPlainObject(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  const knownKeys = [
    'name',
    'description',
    'budget',
    'cpmRate',
    'cpcRate',
    'startDate',
    'endDate',
    'targetCategories',
    'targetRegions',
    'status',
  ] satisfies Array<keyof CampaignPayload>;

  const providedKeys = knownKeys.filter((key) => body[key] !== undefined);
  if (partial && providedKeys.length === 0) {
    return { error: 'At least one field is required for update' };
  }

  const data: CampaignPayload = {};

  if (partial) {
    const name = parseOptionalString(body.name, 'name');
    if (name.error) return name;
    if (name.value !== undefined && name.value !== null) data.name = name.value;
  } else {
    const name = parseRequiredString(body.name, 'name');
    if (name.error) return name;
    data.name = name.value!;
  }

  const description = parseOptionalString(body.description, 'description', { nullable: true });
  if (description.error) return description;
  if (description.value !== undefined) data.description = description.value;

  const budget = parseOptionalNumber(body.budget, 'budget', { required: !partial, min: 0 });
  if (budget.error) return budget;
  if (budget.value !== undefined) data.budget = budget.value ?? undefined;

  const cpmRate = parseOptionalNumber(body.cpmRate, 'cpmRate', { nullable: true, min: 0 });
  if (cpmRate.error) return cpmRate;
  if (cpmRate.value !== undefined) data.cpmRate = cpmRate.value;

  const cpcRate = parseOptionalNumber(body.cpcRate, 'cpcRate', { nullable: true, min: 0 });
  if (cpcRate.error) return cpcRate;
  if (cpcRate.value !== undefined) data.cpcRate = cpcRate.value;

  const startDate = parseOptionalDate(body.startDate, 'startDate', { required: !partial });
  if (startDate.error) return startDate;
  if (startDate.value !== undefined) data.startDate = startDate.value;

  const endDate = parseOptionalDate(body.endDate, 'endDate', { required: !partial });
  if (endDate.error) return endDate;
  if (endDate.value !== undefined) data.endDate = endDate.value;

  const targetCategories = parseOptionalStringArray(body.targetCategories, 'targetCategories');
  if (targetCategories.error) return targetCategories;
  if (targetCategories.value !== undefined) data.targetCategories = targetCategories.value;

  const targetRegions = parseOptionalStringArray(body.targetRegions, 'targetRegions');
  if (targetRegions.error) return targetRegions;
  if (targetRegions.value !== undefined) data.targetRegions = targetRegions.value;

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !CAMPAIGN_STATUSES.includes(body.status as (typeof CAMPAIGN_STATUSES)[number])) {
      return { error: `status must be one of: ${CAMPAIGN_STATUSES.join(', ')}` };
    }
    data.status = body.status as CampaignPayload['status'];
  }

  const effectiveStart = data.startDate ?? undefined;
  const effectiveEnd = data.endDate ?? undefined;
  if (effectiveStart && effectiveEnd && effectiveStart > effectiveEnd) {
    return { error: 'startDate must be before or equal to endDate' };
  }

  return { data };
}

// GET /api/campaigns - List caller's campaigns (scoped to their sponsorId)
router.get('/', ...requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const campaigns = await prisma.campaign.findMany({
      where: {
        sponsorId: req.user!.sponsorId,
        ...(status && { status: status as string as 'ACTIVE' | 'PAUSED' | 'COMPLETED' }),
      },
      include: {
        sponsor: { select: { id: true, name: true, logo: true } },
        _count: { select: { creatives: true, placements: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/:id - Get single campaign; verifies caller owns it
router.get('/:id', ...requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const campaign = await prisma.campaign.findFirst({
      where: { id, sponsorId: req.user!.sponsorId! },
      include: {
        sponsor: true,
        creatives: true,
        placements: {
          include: {
            adSlot: true,
            publisher: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - Create new campaign for the caller's sponsor
router.post('/', ...requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    const validated = validateCampaignPayload(req.body);
    if (!validated.data) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: validated.data.name!,
        description: validated.data.description,
        budget: validated.data.budget!,
        cpmRate: validated.data.cpmRate,
        cpcRate: validated.data.cpcRate,
        startDate: validated.data.startDate!,
        endDate: validated.data.endDate!,
        targetCategories: validated.data.targetCategories || [],
        targetRegions: validated.data.targetRegions || [],
        sponsorId: req.user!.sponsorId!,
      },
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /api/campaigns/:id - Update campaign details for the caller's sponsor
router.put('/:id', ...requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const validated = validateCampaignPayload(req.body, true);
    if (!validated.data) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const existingCampaign = await prisma.campaign.findFirst({
      where: { id, sponsorId: req.user!.sponsorId! },
      select: { id: true, sponsorId: true },
    });

    if (!existingCampaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(validated.data.name !== undefined && { name: validated.data.name }),
        ...(validated.data.description !== undefined && { description: validated.data.description }),
        ...(validated.data.budget !== undefined && { budget: validated.data.budget }),
        ...(validated.data.cpmRate !== undefined && { cpmRate: validated.data.cpmRate }),
        ...(validated.data.cpcRate !== undefined && { cpcRate: validated.data.cpcRate }),
        ...(validated.data.startDate !== undefined && { startDate: validated.data.startDate }),
        ...(validated.data.endDate !== undefined && { endDate: validated.data.endDate }),
        ...(validated.data.targetCategories !== undefined && { targetCategories: validated.data.targetCategories }),
        ...(validated.data.targetRegions !== undefined && { targetRegions: validated.data.targetRegions }),
        ...(validated.data.status !== undefined && { status: validated.data.status }),
      },
      include: {
        sponsor: { select: { id: true, name: true, logo: true } },
        _count: { select: { creatives: true, placements: true } },
      },
    });

    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id - Delete campaign for the caller's sponsor
router.delete('/:id', ...requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const existingCampaign = await prisma.campaign.findFirst({
      where: { id, sponsorId: req.user!.sponsorId! },
      select: { id: true, sponsorId: true },
    });

    if (!existingCampaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    await prisma.campaign.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
