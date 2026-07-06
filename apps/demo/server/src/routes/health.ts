import { Router } from 'express';
import { flagix } from '../flagix.js';
import { SDK_KEY, BASE_URL } from '../config.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await flagix.evaluateAll({ userId: 'health_check' });
    res.json({
      status: 'ok',
      flagix: 'connected',
      sdkKey: SDK_KEY.slice(0, 10) + '...',
      baseUrl: BASE_URL,
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      flagix: 'unreachable',
      sdkKey: SDK_KEY.slice(0, 10) + '...',
      baseUrl: BASE_URL,
    });
  }
});

export { router as healthRouter };
