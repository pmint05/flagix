import type { Request, Response, NextFunction } from 'express';
import type { EvaluationContext } from '@flagix/sdk-core';

declare global {
  namespace Express {
    interface Request {
      flagixContext: EvaluationContext;
    }
  }
}

function parseContext(raw: string): EvaluationContext | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      userId: typeof parsed.userId === 'string' ? parsed.userId : undefined,
      role: typeof parsed.role === 'string' ? parsed.role : undefined,
      attributes:
        typeof parsed.attributes === 'object' && parsed.attributes !== null && !Array.isArray(parsed.attributes)
          ? parsed.attributes
          : undefined,
    };
  } catch {
    return null;
  }
}

export function extractContext(req: Request, _res: Response, next: NextFunction) {
  if (typeof req.query.context === 'string') {
    const ctx = parseContext(req.query.context);
    if (ctx) {
      req.flagixContext = ctx;
      return next();
    }
  }

  req.flagixContext = {
    userId: (req.query.userId as string) || 'anon_default',
    role: (req.query.role as string) || undefined,
  };

  next();
}
