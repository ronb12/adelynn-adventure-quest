const LB_KEY = 'adelynn_quest_leaderboard_v1';
const MAX_ENTRIES = 20;

export interface LeaderboardEntry {
  name: string;
  score: number;
  timeSeconds: number;
  shards: number;
  loreRead: number;
  area: string;
  date: string;
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const existing = getLeaderboard();
  const updated = [...existing, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(LB_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function clearLeaderboard(): void {
  localStorage.removeItem(LB_KEY);
}

export function formatLeaderboardTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
