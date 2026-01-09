import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Maps /api/foo-bar to api/foo-bar.js
// Maps dynamic like /api/driver-stats/:driverId to api/driver-stats/[driverId].js
async function importHandlerForSegments(segments) {
  // Try exact file: api/foo/bar.js
  const exact = path.join(__dirname, 'api', `${segments.join('/')}.js`);
  try {
    // Cache-bust import so code edits are picked up in dev
    const href = pathToFileURL(exact).href + `?v=${Date.now()}`;
    const mod = await import(href);
    return { handler: mod.default, paramKey: null };
  } catch (_) {}

  // Try dynamic param file in the last directory: api/foo/[param].js
  if (segments.length >= 2) {
    const dir = path.join(__dirname, 'api', segments.slice(0, -1).join('/'));
    try {
      const files = await fs.readdir(dir);
      const dyn = files.find(f => /^\[.+\]\.js$/.test(f));
      if (dyn) {
        // Cache-bust dynamic import as well
        const dynHref = pathToFileURL(path.join(dir, dyn)).href + `?v=${Date.now()}`;
        const mod = await import(dynHref);
        const paramKey = dyn.match(/^\[(.+)\]\.js$/)?.[1] || 'id';
        return { handler: mod.default, paramKey };
      }
    } catch (_) {}
  }
  throw new Error('API route not found');
}

const app = express();
app.use(bodyParser.json());

app.all('/api/*', async (req, res) => {
  try {
    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    const segments = req.path.replace(/^\/api\//, '').split('/').filter(Boolean);

    let handler;
    let paramKey = null;
    try {
      const imported = await importHandlerForSegments(segments);
      handler = imported.handler;
      paramKey = imported.paramKey;
    } catch (e) {
      throw e;
    }

    // Ensure query and body
    if (!req.query) {
      req.query = Object.fromEntries(url.searchParams.entries());
    }

    // Attach dynamic param if needed
    if (paramKey) {
      req.query[paramKey] = segments[segments.length - 1];
    }

    if (!handler) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // Our handlers expect (req, res) similar to Next/Vercel
    await handler(req, res);
  } catch (err) {
    console.error('Dev API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.API_DEV_PORT ? Number(process.env.API_DEV_PORT) : 3002;
app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`);
});
