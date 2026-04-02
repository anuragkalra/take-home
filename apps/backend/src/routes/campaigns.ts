import { Router, type Request, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';

const router: IRouter = Router();

// GET /api/campaigns - List all campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, sponsorId } = req.query;

    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(status && { status: status as string as 'ACTIVE' | 'PAUSED' | 'COMPLETED' }),
        ...(sponsorId && { sponsorId: getParam(sponsorId) }),
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

// GET /api/campaigns/:id - Get single campaign with details
router.get('/:id', async (req: Request, res: Response) => {
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

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      budget,
      cpmRate,
      cpcRate,
      startDate,
      endDate,
      targetCategories,
      targetRegions,
      sponsorId,
    } = req.body;

    if (!name || !budget || !startDate || !endDate || !sponsorId) {
      res.status(400).json({
        error: 'Name, budget, startDate, endDate, and sponsorId are required',
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
        sponsorId,
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

// TODO: Add PUT /api/campaigns/:id endpoint
// Update campaign details (name, budget, dates, status, etc.)

export default router;
