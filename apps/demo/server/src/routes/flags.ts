import { Router } from 'express';
import { flagix } from '../flagix.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const flags = await flagix.evaluateAll(req.flagixContext);
    res.json({
      context: {
        userId: req.flagixContext.userId,
        role: req.flagixContext.role ?? null,
        attributes: req.flagixContext.attributes ?? {},
      },
      flags,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(502).json({
      error: 'Failed to evaluate flags',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

router.get('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    const result = await flagix.evaluate(key, req.flagixContext, null);
    res.json({
      key,
      value: result,
      context: {
        userId: req.flagixContext.userId,
        role: req.flagixContext.role ?? null,
      },
      evaluatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(502).json({
      error: `Failed to evaluate flag "${key}"`,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export { router as flagsRouter };
