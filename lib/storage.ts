import AsyncStorage from "@react-native-async-storage/async-storage";

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

export async function getThemeMode(): Promise<ThemeMode> {
  const raw = await AsyncStorage.getItem(APP_THEME_MODE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }

  return "system";
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(APP_THEME_MODE_KEY, mode);
}

export async function getLastReadPage(): Promise<number> {
  const raw = await AsyncStorage.getItem(READING_LAST_PAGE_KEY);
  const parsed = Number(raw ?? "1");
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 604) {
    return 1;
  }

  return parsed;
}

export async function setLastReadPage(page: number): Promise<void> {
  await AsyncStorage.setItem(READING_LAST_PAGE_KEY, String(page));
}

export async function getReadPages(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(READING_READ_PAGES_KEY);
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
  await AsyncStorage.setItem(READING_READ_PAGES_KEY, JSON.stringify(next));
}

export async function clearReadingProgress(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(READING_LAST_PAGE_KEY),
    AsyncStorage.removeItem(READING_READ_PAGES_KEY),
  ]);
}

export function getQuranPageCacheKey(page: number): string {
  return `${QURAN_PAGE_PREFIX}${page}`;
}

export async function clearQuranPageCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const quranKeys = keys.filter((key) => key.startsWith(QURAN_PAGE_PREFIX));
  if (quranKeys.length === 0) {
    return;
  }

  await Promise.all(quranKeys.map((key) => AsyncStorage.removeItem(key)));
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
  await AsyncStorage.setItem(
    PRAYER_LAST_LOCATION_KEY,
    JSON.stringify(location),
  );
}

export async function getPrayerMethod(): Promise<number> {
  const raw = await AsyncStorage.getItem(PRAYER_METHOD_KEY);
  const parsed = Number(raw ?? "20");
  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return parsed;
}

export async function setPrayerMethod(method: number): Promise<void> {
  await AsyncStorage.setItem(PRAYER_METHOD_KEY, String(method));
}

export async function getLastLocation(): Promise<SavedLocation | null> {
  const raw = await AsyncStorage.getItem(PRAYER_LAST_LOCATION_KEY);
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
  const raw = await AsyncStorage.getItem(key);
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
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getQuranViewMode(): Promise<QuranViewMode> {
  const raw = await AsyncStorage.getItem(QURAN_VIEW_MODE_KEY);
  if (raw === "ayat" || raw === "page") return raw;
  return "ayat";
}

export async function setQuranViewMode(mode: QuranViewMode): Promise<void> {
  await AsyncStorage.setItem(QURAN_VIEW_MODE_KEY, mode);
}

export async function getQuranShowTranslation(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(QURAN_SHOW_TRANSLATION_KEY);
  return raw !== "false";
}

export async function setQuranShowTranslation(show: boolean): Promise<void> {
  await AsyncStorage.setItem(QURAN_SHOW_TRANSLATION_KEY, String(show));
}
