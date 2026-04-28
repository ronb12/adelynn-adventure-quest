const API = '/api/leaderboard';

export interface LeaderboardEntry {
  name: string;
  score: number;
  timeSeconds: number;
  shards: number;
  loreRead: number;
  area: string;
  date: string;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error('fetch failed');
    return (await res.json()) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export async function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'date'>): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('submit failed');
    return (await res.json()) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function formatLeaderboardTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
