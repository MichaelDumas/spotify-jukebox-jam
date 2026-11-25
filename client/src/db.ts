import Database from 'better-sqlite3';

export interface Track {
  uri: string;
  name: string;
  artist: string;
  art: string;
}

export interface QueueItem extends Track {
  id: number;
  guest_id: string;
  added_at: number;
}

const db = new Database('jukebox.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    refresh_token TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uri TEXT NOT NULL,
    name TEXT NOT NULL,
    artist TEXT NOT NULL,
    art TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    added_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id TEXT NOT NULL,
    requested_at INTEGER NOT NULL
  );
`);

export const AuthDB = {
  getRefreshToken(): string | null {
    const row = db
    .prepare('SELECT refresh_token FROM auth WHERE id = 1')
    .get() as { refresh_token: string } | undefined;
    return row?.refresh_token ?? null;
  },

  saveRefreshToken(refreshToken: string): void {
    db.prepare(`
      INSERT INTO auth (id, refresh_token)
      VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET refresh_token = excluded.refresh_token
    `).run(refreshToken);
  },
};

export const QueueDB = {
  all(): QueueItem[] {
    return db
    .prepare('SELECT * FROM queue ORDER BY id ASC')
    .all() as QueueItem[];
  },

  add(track: Track, guestId: string): void {
    db.prepare(`
      INSERT INTO queue (uri, name, artist, art, guest_id, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(track.uri, track.name, track.artist, track.art, guestId, Date.now());
  },

  popNext(): QueueItem | undefined {
    const next = db
    .prepare('SELECT * FROM queue ORDER BY id ASC LIMIT 1')
    .get() as QueueItem | undefined;

    if (next) {
      db.prepare('DELETE FROM queue WHERE id = ?').run(next.id);
    }
    return next;
  },
};

export const RateLimitDB = {
  countRecent(guestId: string, windowMs: number): number {
    const cutoff = Date.now() - windowMs;
    const row = db
    .prepare('SELECT COUNT(*) as count FROM rate_limits WHERE guest_id = ? AND requested_at > ?')
    .get(guestId, cutoff) as { count: number };
    return row.count;
  },

  record(guestId: string): void {
    db.prepare('INSERT INTO rate_limits (guest_id, requested_at) VALUES (?, ?)').run(
        guestId,
        Date.now()
    );
  },
};