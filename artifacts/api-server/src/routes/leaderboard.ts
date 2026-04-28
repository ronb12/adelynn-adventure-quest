import { Router } from "express";
import { db, pool, leaderboardTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

// Ensure table exists (idempotent)
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      score       INTEGER NOT NULL,
      time_seconds INTEGER NOT NULL,
      shards      INTEGER NOT NULL DEFAULT 0,
      lore_read   INTEGER NOT NULL DEFAULT 0,
      area        TEXT NOT NULL DEFAULT 'field',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

let tableReady = false;
async function ready() {
  if (!tableReady) { await ensureTable(); tableReady = true; }
}

// GET /api/leaderboard — top 20 scores
router.get("/leaderboard", async (_req, res) => {
  try {
    await ready();
    const rows = await db
      .select()
      .from(leaderboardTable)
      .orderBy(desc(leaderboardTable.score))
      .limit(20);
    res.json(rows.map(r => ({
      name:        r.name,
      score:       r.score,
      timeSeconds: r.timeSeconds,
      shards:      r.shards,
      loreRead:    r.loreRead,
      area:        r.area,
      date:        r.createdAt.toLocaleDateString('en-US'),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// POST /api/leaderboard — submit a score
router.post("/leaderboard", async (req, res) => {
  try {
    await ready();
    const { name, score, timeSeconds, shards, loreRead, area } = req.body as {
      name: string; score: number; timeSeconds: number;
      shards: number; loreRead: number; area: string;
    };

    if (!name || typeof score !== "number") {
      res.status(400).json({ error: "name and score required" });
      return;
    }

    const trimmedName = String(name).trim().slice(0, 20);
    if (!trimmedName) { res.status(400).json({ error: "name required" }); return; }

    await db.insert(leaderboardTable).values({
      name:        trimmedName,
      score:       Math.max(0, Math.floor(score)),
      timeSeconds: Math.max(0, Math.floor(timeSeconds ?? 0)),
      shards:      Math.min(3, Math.max(0, Math.floor(shards ?? 0))),
      loreRead:    Math.min(9, Math.max(0, Math.floor(loreRead ?? 0))),
      area:        String(area ?? "field").slice(0, 20),
    });

    // Return the refreshed top 20
    const rows = await db
      .select()
      .from(leaderboardTable)
      .orderBy(desc(leaderboardTable.score))
      .limit(20);
    res.json(rows.map(r => ({
      name:        r.name,
      score:       r.score,
      timeSeconds: r.timeSeconds,
      shards:      r.shards,
      loreRead:    r.loreRead,
      area:        r.area,
      date:        r.createdAt.toLocaleDateString('en-US'),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to submit score" });
  }
});

export default router;
