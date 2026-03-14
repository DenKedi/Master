// Custom Next.js server with Socket.io support
// Run with: npx ts-node --project tsconfig.server.json server.ts
// Or add "start": "node server.js" after build

import { loadEnvConfig } from '@next/env';
const dev = process.env.NODE_ENV !== 'production';
loadEnvConfig(process.cwd(), dev);

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { getSocketServer } from './src/lib/socket';
import connectDB from './src/lib/mongodb';
import { syncCardsFromRegistry } from './src/lib/cards/sync';

const hostname = process.env.HOST ?? 'localhost';
const port = parseInt(process.env.PORT ?? '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  try {
    await connectDB();
    console.log('> Successfully connected to MongoDB');
  } catch (error) {
    console.error('> Error connecting to MongoDB:', error);
    process.exit(1);
  }

  // Sync card registry → MongoDB on every startup
  try {
    const { created, updated, deactivated } = await syncCardsFromRegistry();
    console.log(`> Card sync complete: ${created} created, ${updated} updated, ${deactivated} deactivated`);
  } catch (error) {
    console.error('> Card sync failed (non-fatal):', error);
  }

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '/', true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io
  getSocketServer(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
