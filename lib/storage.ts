import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const APP_THEME_MODE_KEY = "app.themeMode";
const READING_LAST_PAGE_KEY = "reading.lastPage";
const READING_READ_PAGES_KEY = "reading.readPages";
const PRAYER_LAST_LOCATION_KEY = "prayer.lastLocation";
const PRAYER_METHOD_KEY = "prayer.method";

const QURAN_PAGE_PREFIX = "quran.page.";
const PRAYER_TODAY_PREFIX = "prayer.today.";
const QURAN_VIEW_MODE_KEY = "quran.viewMode";
const QURAN_SHOW_TRANSLATION_KEY = "quran.showTranslation";

export type ThemeMode = "system" | "light" | "dark";
export type QuranViewMode = "ayat" | "page";

export type SavedLocation = {
  lat: number;
  lng: number;
  name: string;
};

type WebStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  key: (index: number) => string | null;
  length: number;
};

const memoryStorage = new Map<string, string>();

function getWebLocalStorage(): WebStorageLike | null {
  if (Platform.OS !== "web") {
    return null;
  }

  const storage = (globalThis as { localStorage?: WebStorageLike })
    .localStorage;
  return storage ?? null;
}

function isLegacyStorageUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("native module is null") ||
    message.includes("legacy storage")
  );
}

function fallbackGetItem(key: string): string | null {
  const webStorage = getWebLocalStorage();
  if (webStorage) {
    try {
      return webStorage.getItem(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  }

  return memoryStorage.get(key) ?? null;
}

function fallbackSetItem(key: string, value: string): void {
  const webStorage = getWebLocalStorage();
  if (webStorage) {
    try {
      webStorage.setItem(key, value);
      return;
    } catch {
      memoryStorage.set(key, value);
      return;
    }
  }

  memoryStorage.set(key, value);
}

function fallbackRemoveItem(key: string): void {
  const webStorage = getWebLocalStorage();
  if (webStorage) {
    try {
      webStorage.removeItem(key);
    } catch {
      // ignore and continue clearing memory fallback
    }
  }

  memoryStorage.delete(key);
}

function fallbackGetAllKeys(): string[] {
  const keySet = new Set<string>(memoryStorage.keys());
  const webStorage = getWebLocalStorage();
  if (webStorage) {
    for (let i = 0; i < webStorage.length; i += 1) {
      const key = webStorage.key(i);
      if (key) {
        keySet.add(key);
      }
    }
  }

  return [...keySet];
}

async function storageGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    if (!isLegacyStorageUnavailableError(error)) {
      throw error;
    }
    return fallbackGetItem(key);
  }
}

async function storageSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    if (!isLegacyStorageUnavailableError(error)) {
      throw error;
    }
    fallbackSetItem(key, value);
  }
}

async function storageRemoveItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    if (!isLegacyStorageUnavailableError(error)) {
      throw error;
    }
    fallbackRemoveItem(key);
  }
}

async function storageGetAllKeys(): Promise<string[]> {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    if (!isLegacyStorageUnavailableError(error)) {
      throw error;
    }
    return fallbackGetAllKeys();
  }
}

export async function getThemeMode(): Promise<ThemeMode> {
  const raw = await storageGetItem(APP_THEME_MODE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }

  return "system";
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await storageSetItem(APP_THEME_MODE_KEY, mode);
}

export async function getLastReadPage(): Promise<number> {
  const raw = await storageGetItem(READING_LAST_PAGE_KEY);
  const parsed = Number(raw ?? "1");
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 604) {
    return 1;
  }

  return parsed;
}

export async function setLastReadPage(page: number): Promise<void> {
  await storageSetItem(READING_LAST_PAGE_KEY, String(page));
}

export async function getReadPages(): Promise<number[]> {
  const raw = await storageGetItem(READING_READ_PAGES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 604)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export async function addReadPage(page: number): Promise<void> {
  const current = await getReadPages();
  if (current.includes(page)) {
    return;
  }

  const next = [...current, page].sort((a, b) => a - b);
  await storageSetItem(READING_READ_PAGES_KEY, JSON.stringify(next));
}

export async function clearReadingProgress(): Promise<void> {
  await Promise.all([
    storageRemoveItem(READING_LAST_PAGE_KEY),
    storageRemoveItem(READING_READ_PAGES_KEY),
  ]);
}

export function getQuranPageCacheKey(page: number): string {
  return `${QURAN_PAGE_PREFIX}${page}`;
}

export async function clearQuranPageCache(): Promise<void> {
  const keys = await storageGetAllKeys();
  const quranKeys = keys.filter((key) => key.startsWith(QURAN_PAGE_PREFIX));
  if (quranKeys.length === 0) {
    return;
  }

  await Promise.all(quranKeys.map((key) => storageRemoveItem(key)));
}

export function getPrayerTodayCacheKey(
  date: string,
  lat: number,
  lng: number,
): string {
  const latPart = lat.toFixed(3);
  const lngPart = lng.toFixed(3);
  return `${PRAYER_TODAY_PREFIX}${date}.${latPart}.${lngPart}`;
}

export async function saveLastLocation(location: SavedLocation): Promise<void> {
  await storageSetItem(PRAYER_LAST_LOCATION_KEY, JSON.stringify(location));
}

export async function getPrayerMethod(): Promise<number> {
  const raw = await storageGetItem(PRAYER_METHOD_KEY);
  const parsed = Number(raw ?? "20");
  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return parsed;
}

export async function setPrayerMethod(method: number): Promise<void> {
  await storageSetItem(PRAYER_METHOD_KEY, String(method));
}

export async function getLastLocation(): Promise<SavedLocation | null> {
  const raw = await storageGetItem(PRAYER_LAST_LOCATION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SavedLocation;
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      typeof parsed.name === "string"
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getJsonCache<T>(key: string): Promise<T | null> {
  const raw = await storageGetItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJsonCache<T>(key: string, value: T): Promise<void> {
  await storageSetItem(key, JSON.stringify(value));
}

export async function getQuranViewMode(): Promise<QuranViewMode> {
  const raw = await storageGetItem(QURAN_VIEW_MODE_KEY);
  if (raw === "ayat" || raw === "page") return raw;
  return "ayat";
}

export async function setQuranViewMode(mode: QuranViewMode): Promise<void> {
  await storageSetItem(QURAN_VIEW_MODE_KEY, mode);
}

export async function getQuranShowTranslation(): Promise<boolean> {
  const raw = await storageGetItem(QURAN_SHOW_TRANSLATION_KEY);
  return raw !== "false";
}

export async function setQuranShowTranslation(show: boolean): Promise<void> {
  await storageSetItem(QURAN_SHOW_TRANSLATION_KEY, String(show));
}
