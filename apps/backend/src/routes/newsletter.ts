import { Router, type IRouter, type Request, type Response } from 'express';

const router: IRouter = Router();

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/newsletter/subscribe - Accept newsletter subscriptions
router.post('/subscribe', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  return res.json({
    success: true,
    message: 'Thanks for subscribing!',
  });
});

export default router;
