import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const route = '/api/subscribe/';
const databasePath = process.env.SUBSCRIBERS_DB_PATH
  ? resolve(process.env.SUBSCRIBERS_DB_PATH)
  : fileURLToPath(new URL('../.private/subscribers.sqlite', import.meta.url));
const requestLimit = 2048;

export function localSignup() {
  let insert;

  async function subscribe(req, res, next) {
    const path = req.url?.split('?')[0];
    if (path !== route && path !== '/api/subscribe') return next();

    const wantsJson = req.headers.accept?.includes('application/json');
    const reply = (status, message, subscribed = false) => {
      res.writeHead(status, {
        'Cache-Control': 'no-store',
        'Content-Type': wantsJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(wantsJson ? JSON.stringify({ subscribed, message }) : message);
    };
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return reply(405, 'Use the signup form to subscribe.');
    }
    const origin = req.headers.origin;
    if (origin && origin !== `http://${req.headers.host}`) return reply(403, 'Please subscribe from this website.');
    if (req.headers['content-type']?.split(';')[0] !== 'application/x-www-form-urlencoded') {
      return reply(415, 'Use the signup form to subscribe.');
    }

    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req.iterator({ destroyOnReturn: false })) {
        size += chunk.length;
        if (size > requestLimit) {
          req.resume();
          return reply(413, 'That submission was too large.');
        }
        chunks.push(chunk);
      }
      const email = new URLSearchParams(Buffer.concat(chunks).toString()).get('email')?.trim().toLowerCase() ?? '';
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply(400, 'Check your email address and try again.');
      }

      if (!insert) {
        mkdirSync(dirname(databasePath), { recursive: true });
        const database = new DatabaseSync(databasePath);
        database.exec(`
          PRAGMA busy_timeout = 5000;
          CREATE TABLE IF NOT EXISTS subscribers (
            email TEXT PRIMARY KEY,
            subscribed_at TEXT NOT NULL
          );
        `);
        insert = database.prepare('INSERT INTO subscribers VALUES (?, ?) ON CONFLICT(email) DO NOTHING');
      }
      insert.run(email, new Date().toISOString());
      return reply(200, "You're in.", true);
    } catch (error) {
      console.error('Local signup storage failed:', error.code ?? error.name);
      return reply(500, 'Couldn’t save your email. Try again in a moment.');
    }
  }

  return {
    name: 'local-signup',
    configureServer(server) {
      server.middlewares.use(subscribe);
    },
  };
}
