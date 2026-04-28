import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leaderboardTable = pgTable("leaderboard", {
  id:          serial("id").primaryKey(),
  name:        text("name").notNull(),
  score:       integer("score").notNull(),
  timeSeconds: integer("time_seconds").notNull(),
  shards:      integer("shards").notNull().default(0),
  loreRead:    integer("lore_read").notNull().default(0),
  area:        text("area").notNull().default("field"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboardTable).omit({ id: true, createdAt: true });
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboardTable.$inferSelect;
