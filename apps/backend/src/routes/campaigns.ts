import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { authMiddleware, roleMiddleware, type AuthRequest } from '../auth.js';

const router: IRouter = Router();

const requireSponsor = [authMiddleware, roleMiddleware(['SPONSOR'])];

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
    const campaign = await prisma.campaign.findUnique({
      where: { id },
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

    if (campaign.sponsorId !== req.user!.sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
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
    const { name, description, budget, cpmRate, cpcRate, startDate, endDate, targetCategories, targetRegions } =
      req.body;

    if (!name || !budget || !startDate || !endDate) {
      res.status(400).json({
        error: 'Name, budget, startDate, and endDate are required',
      });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        budget,
        cpmRate,
        cpcRate,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetCategories: targetCategories || [],
        targetRegions: targetRegions || [],
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
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, sponsorId: true },
    });

    if (!existingCampaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (existingCampaign.sponsorId !== req.user!.sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { name, description, budget, cpmRate, cpcRate, startDate, endDate, targetCategories, targetRegions, status } =
      req.body;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(budget !== undefined && { budget }),
        ...(cpmRate !== undefined && { cpmRate }),
        ...(cpcRate !== undefined && { cpcRate }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(targetCategories !== undefined && { targetCategories }),
        ...(targetRegions !== undefined && { targetRegions }),
        ...(status !== undefined && { status }),
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
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, sponsorId: true },
    });

    if (!existingCampaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (existingCampaign.sponsorId !== req.user!.sponsorId) {
      res.status(403).json({ error: 'Forbidden' });
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
