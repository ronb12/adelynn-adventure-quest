import AsyncStorage from "@react-native-async-storage/async-storage";

const BEST_KEY = "adelynn-quest-best-v1";
const SWORDS_KEY = "adelynn-quest-swords-v1";

export interface BestRecord {
  score: number;
  maxCombo: number;
  kills: number;
}

export async function saveBestRecord(record: BestRecord): Promise<void> {
  try {
    const existing = await loadBestRecord();
    if (!existing || record.score > existing.score) {
      await AsyncStorage.setItem(BEST_KEY, JSON.stringify(record));
    }
  } catch {}
}

export async function loadBestRecord(): Promise<BestRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(BEST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BestRecord;
  } catch {
    return null;
  }
}

export async function saveUnlockedSwords(swords: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SWORDS_KEY, JSON.stringify(swords));
  } catch {}
}

export async function loadUnlockedSwords(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SWORDS_KEY);
    if (!raw) return ["crystal"];
    return JSON.parse(raw) as string[];
  } catch {
    return ["crystal"];
  }
}
