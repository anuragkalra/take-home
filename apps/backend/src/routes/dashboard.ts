import { Router, type Request, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';

const router: IRouter = Router();

// GET /api/dashboard/stats - Get overall platform stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [sponsorCount, publisherCount, activeCampaigns, totalPlacements, placementMetrics] =
      await Promise.all([
        prisma.sponsor.count({ where: { isActive: true } }),
        prisma.publisher.count({ where: { isActive: true } }),
        prisma.campaign.count({ where: { status: 'ACTIVE' } }),
        prisma.placement.count(),
        prisma.placement.aggregate({
          _sum: {
            impressions: true,
            clicks: true,
            conversions: true,
          },
        }),
      ]);

    res.json({
      sponsors: sponsorCount,
      publishers: publisherCount,
      activeCampaigns,
      totalPlacements,
      metrics: {
        totalImpressions: placementMetrics._sum.impressions || 0,
        totalClicks: placementMetrics._sum.clicks || 0,
        totalConversions: placementMetrics._sum.conversions || 0,
        avgCtr: placementMetrics._sum.impressions
          ? (
              ((placementMetrics._sum.clicks || 0) / placementMetrics._sum.impressions) *
              100
            ).toFixed(2)
          : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
