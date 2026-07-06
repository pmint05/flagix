import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORT } from './config.js';
import { extractContext } from './middleware/context.js';
import { healthRouter } from './routes/health.js';
import { flagsRouter } from './routes/flags.js';
import { contentRouter } from './routes/content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(morgan('dev'));
app.use(cors({ origin: true, credentials: true }));

const api = express.Router();
api.use('/health', healthRouter);
api.use('/flags', extractContext, flagsRouter);
api.use('/content', extractContext, contentRouter);
app.use('/api', api);

const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.use((_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Demo Server running at http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/health                                    — Health check`);
  console.log(`  GET /api/flags?userId=X                            — Evaluate all flags (server-side)`);
  console.log(`  GET /api/flags/:key?userId=X                       — Evaluate single flag (server-side)`);
  console.log(`  GET /api/content/hero?userId=X                     — Hero section (Canary + A/B + Promo)`);
  console.log(`  GET /api/content/features?userId=X&plan=pro        — Features (Tier + Kill + Beta)`);
  console.log(`  GET /api/content/pricing?userId=X&plan=ent         — Pricing (A/B Test)`);
  console.log(`Static files served from: ${clientDist}\n`);
});
