import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { authMiddleware, roleMiddleware, type AuthRequest } from '../auth.js';

const router: IRouter = Router();

const requirePublisher = [authMiddleware, roleMiddleware(['PUBLISHER'])];
const requireSponsor = [authMiddleware, roleMiddleware(['SPONSOR'])];
const AD_SLOT_TYPES = ['DISPLAY', 'VIDEO', 'NATIVE', 'NEWSLETTER', 'PODCAST'] as const;

type AdSlotPayload = {
  name?: string;
  description?: string | null;
  type?: (typeof AD_SLOT_TYPES)[number];
  position?: string | null;
  width?: number | null;
  height?: number | null;
  basePrice?: number;
  cpmFloor?: number | null;
  isAvailable?: boolean;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseString(
  value: unknown,
  field: string,
  options: { required?: boolean; nullable?: boolean } = {},
): { value?: string | null; error?: string } {
  if (value === undefined) {
    return options.required ? { error: `${field} is required` } : {};
  }

  if (value === null) {
    if (options.nullable) return { value: null };
    return { error: `${field} must be a string` };
  }

  if (typeof value !== 'string' || (options.required && value.trim() === '')) {
    return { error: `${field} must be a non-empty string` };
  }

  return { value: value.trim() };
}

function parseNumber(
  value: unknown,
  field: string,
  options: { required?: boolean; nullable?: boolean; integer?: boolean; min?: number } = {},
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

  if (options.integer && !Number.isInteger(parsed)) {
    return { error: `${field} must be an integer` };
  }

  if (options.min !== undefined && parsed < options.min) {
    return { error: `${field} must be at least ${options.min}` };
  }

  return { value: parsed };
}

function validateAdSlotPayload(body: unknown, partial = false): { data?: AdSlotPayload; error?: string } {
  if (!isPlainObject(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  const knownKeys = ['name', 'description', 'type', 'position', 'width', 'height', 'basePrice', 'cpmFloor', 'isAvailable'] satisfies Array<keyof AdSlotPayload>;
  const providedKeys = knownKeys.filter((key) => body[key] !== undefined);

  if (partial && providedKeys.length === 0) {
    return { error: 'At least one field is required for update' };
  }

  const data: AdSlotPayload = {};

  const name = parseString(body.name, 'name', { required: !partial });
  if (name.error) return name;
  if (name.value !== undefined) data.name = name.value ?? undefined;

  const description = parseString(body.description, 'description', { nullable: true });
  if (description.error) return description;
  if (description.value !== undefined) data.description = description.value;

  if (body.type !== undefined) {
    if (typeof body.type !== 'string' || !AD_SLOT_TYPES.includes(body.type as (typeof AD_SLOT_TYPES)[number])) {
      return { error: `type must be one of: ${AD_SLOT_TYPES.join(', ')}` };
    }
    data.type = body.type as AdSlotPayload['type'];
  } else if (!partial) {
    return { error: 'type is required' };
  }

  const position = parseString(body.position, 'position', { nullable: true });
  if (position.error) return position;
  if (position.value !== undefined) data.position = position.value;

  const width = parseNumber(body.width, 'width', { nullable: true, integer: true, min: 1 });
  if (width.error) return width;
  if (width.value !== undefined) data.width = width.value;

  const height = parseNumber(body.height, 'height', { nullable: true, integer: true, min: 1 });
  if (height.error) return height;
  if (height.value !== undefined) data.height = height.value;

  const basePrice = parseNumber(body.basePrice, 'basePrice', { required: !partial, min: 0 });
  if (basePrice.error) return basePrice;
  if (basePrice.value !== undefined) data.basePrice = basePrice.value ?? undefined;

  const cpmFloor = parseNumber(body.cpmFloor, 'cpmFloor', { nullable: true, min: 0 });
  if (cpmFloor.error) return cpmFloor;
  if (cpmFloor.value !== undefined) data.cpmFloor = cpmFloor.value;

  if (body.isAvailable !== undefined) {
    if (typeof body.isAvailable !== 'boolean') {
      return { error: 'isAvailable must be a boolean' };
    }
    data.isAvailable = body.isAvailable;
  }

  return { data };
}

// GET /api/ad-slots - Publishers see their own slots; sponsors can browse all
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { type, available } = req.query;

    const adSlots = await prisma.adSlot.findMany({
      where: {
        ...(req.user!.publisherId && { publisherId: req.user!.publisherId }),
        ...(type && {
          type: type as string as 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'NEWSLETTER' | 'PODCAST',
        }),
        ...(available === 'true' && { isAvailable: true }),
      },
      include: {
        publisher: { select: { id: true, name: true, category: true, monthlyViews: true } },
        _count: { select: { placements: true } },
      },
      orderBy: { basePrice: 'desc' },
    });

    res.json(adSlots);
  } catch (error) {
    console.error('Error fetching ad slots:', error);
    res.status(500).json({ error: 'Failed to fetch ad slots' });
  }
});

// GET /api/ad-slots/:id - Publishers may only view their own slots; sponsors may browse any slot
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const adSlot = await prisma.adSlot.findFirst({
      where: {
        id,
        ...(req.user!.publisherId ? { publisherId: req.user!.publisherId } : {}),
      },
      include: {
        publisher: true,
        placements: {
          include: {
            campaign: { select: { id: true, name: true, status: true } },
          },
        },
      },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    res.json(adSlot);
  } catch (error) {
    console.error('Error fetching ad slot:', error);
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});

// POST /api/ad-slots - Create new ad slot for the caller's publisher
router.post('/', ...requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    const validated = validateAdSlotPayload(req.body);
    if (!validated.data) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const adSlot = await prisma.adSlot.create({
      data: {
        name: validated.data.name!,
        description: validated.data.description,
        type: validated.data.type!,
        basePrice: validated.data.basePrice!,
        publisherId: req.user!.publisherId!,
        position: validated.data.position,
        width: validated.data.width,
        height: validated.data.height,
        cpmFloor: validated.data.cpmFloor,
        ...(validated.data.isAvailable !== undefined && { isAvailable: validated.data.isAvailable }),
      },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(adSlot);
  } catch (error) {
    console.error('Error creating ad slot:', error);
    res.status(500).json({ error: 'Failed to create ad slot' });
  }
});

// POST /api/ad-slots/:id/book - Book an ad slot; requires sponsor session
router.post('/:id/book', ...requireSponsor, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const { message } = req.body;
    const sponsorId = req.user!.sponsorId!;

    // Check if slot exists and is available
    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: { publisher: true },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (!adSlot.isAvailable) {
      res.status(400).json({ error: 'Ad slot is no longer available' });
      return;
    }

    // Mark slot as unavailable
    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: false },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    // In a real app, you'd create a Placement record here
    // For now, we just mark it as booked
    console.log(`Ad slot ${id} booked by sponsor ${sponsorId}. Message: ${message || 'None'}`);

    res.json({
      success: true,
      message: 'Ad slot booked successfully!',
      adSlot: updatedSlot,
    });
  } catch (error) {
    console.error('Error booking ad slot:', error);
    res.status(500).json({ error: 'Failed to book ad slot' });
  }
});

// POST /api/ad-slots/:id/unbook - Reset ad slot to available (for testing)
// Requires auth; publisher must own the slot
router.post('/:id/unbook', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      select: { publisherId: true },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (adSlot.publisherId !== req.user!.publisherId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: true },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: 'Ad slot is now available again',
      adSlot: updatedSlot,
    });
  } catch (error) {
    console.error('Error unbooking ad slot:', error);
    res.status(500).json({ error: 'Failed to unbook ad slot' });
  }
});

// PUT /api/ad-slots/:id - Update ad slot details for the caller's publisher
router.put('/:id', ...requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const validated = validateAdSlotPayload(req.body, true);
    if (!validated.data) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const existingAdSlot = await prisma.adSlot.findFirst({
      where: { id, publisherId: req.user!.publisherId! },
      select: { id: true, publisherId: true },
    });

    if (!existingAdSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    const adSlot = await prisma.adSlot.update({
      where: { id },
      data: {
        ...(validated.data.name !== undefined && { name: validated.data.name }),
        ...(validated.data.description !== undefined && { description: validated.data.description }),
        ...(validated.data.type !== undefined && { type: validated.data.type }),
        ...(validated.data.position !== undefined && { position: validated.data.position }),
        ...(validated.data.width !== undefined && { width: validated.data.width }),
        ...(validated.data.height !== undefined && { height: validated.data.height }),
        ...(validated.data.basePrice !== undefined && { basePrice: validated.data.basePrice }),
        ...(validated.data.cpmFloor !== undefined && { cpmFloor: validated.data.cpmFloor }),
        ...(validated.data.isAvailable !== undefined && { isAvailable: validated.data.isAvailable }),
      },
      include: {
        publisher: { select: { id: true, name: true, category: true, monthlyViews: true } },
        _count: { select: { placements: true } },
      },
    });

    res.json(adSlot);
  } catch (error) {
    console.error('Error updating ad slot:', error);
    res.status(500).json({ error: 'Failed to update ad slot' });
  }
});

// DELETE /api/ad-slots/:id - Delete ad slot for the caller's publisher
router.delete('/:id', ...requirePublisher, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const existingAdSlot = await prisma.adSlot.findFirst({
      where: { id, publisherId: req.user!.publisherId! },
      select: { id: true, publisherId: true },
    });

    if (!existingAdSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    await prisma.adSlot.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting ad slot:', error);
    res.status(500).json({ error: 'Failed to delete ad slot' });
  }
});

export default router;
