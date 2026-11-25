import 'dotenv/config';
import crypto from 'crypto';
import os from 'os';
import express, { type Response } from 'express';
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./router.ts";
import cookieParser from 'cookie-parser';
import {exchangeCode, getAuthUrl } from "./spotify.ts";
import path from 'path';
import { fileURLToPath } from 'url';
import {getNowPlaying, startPoller} from "./poller.ts";
// import { QueueDB, RateLimitDB } from './db.js';
// import { startPoller, getNowPlaying } from './poller.js';

const app = express();
const PORT = 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'client', 'dist');

app.use(express.json());
app.use(cookieParser());
app.use(express.static(distPath));

// Assign an anonymous guest_id cookie automatically
app.use((req, res, next) => {
  if (!req.cookies.guest_id) {
    const id = crypto.randomUUID();
    res.cookie('guest_id', id, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 3600_000 });
    res.locals.guestId = id;
  } else {
    res.locals.guestId = req.cookies.guest_id;
  }
  next();
});

app.use(
    "/api/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
    })
);

const playerStatusPayload = () => `data: ${JSON.stringify({ nowPlaying: getNowPlaying(), queue: "QueueDB.all()" })}\n\n`;

// --- SSE Live Updates ---
const clients = new Set<Response>();
function broadcastState() {
  for (const res of clients) res.write(playerStatusPayload());
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(playerStatusPayload());
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// --- Host Auth Routes (Run on host machine only) ---
app.get('/host/login', (_, res) => res.redirect(getAuthUrl()));

app.get('/callback', async (req, res) => {
  try {
    await exchangeCode(req.query.code as string);
    res.send('<h1>Host connected!</h1><p>Start playing a song on Spotify, then share the LAN URL with guests.</p>');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).send(`Auth error: ${message}`);
  }
});

// --- Start Server & Poller ---
startPoller(broadcastState);

app.use((_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const lanIp = Object.values(os.networkInterfaces())
  .flat()
  .find((i) => i?.family === 'IPv4' && !i.internal)?.address || 'localhost';

  console.log(`\nHost Login:  http://127.0.0.1:${PORT}/host/login`);
  console.log(`Guest URL:   http://${lanIp}:${PORT}\n`);
});