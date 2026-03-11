import {
  getJsonCache,
  getPrayerMethod,
  getPrayerTodayCacheKey,
  saveLastLocation,
  setJsonCache,
  type SavedLocation,
} from "@/lib/storage";
import * as Location from "expo-location";

const ALADHAN_BASE_URL = "https://api.aladhan.com/v1";
type AladhanResponse = {
  code: number;
  status: string;
  data: {
    timings: Record<string, string>;
  };
};

export type PrayerTimesResult = {
  timings: Record<string, string>;
  location: SavedLocation;
  fromCache: boolean;
};

function formatDateForAladhan(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function cleanTimings(timings: Record<string, string>): Record<string, string> {
  const keys = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  return keys.reduce<Record<string, string>>((acc, key) => {
    if (timings[key]) {
      acc[key] = timings[key].split(" ")[0];
    }
    return acc;
  }, {});
}

async function getCurrentLocation(): Promise<SavedLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission is required to load prayer times");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  const place = await Location.reverseGeocodeAsync({
    latitude: lat,
    longitude: lng,
  });
  const name = place[0]
    ? [place[0].city, place[0].region, place[0].country]
        .filter(Boolean)
        .join(", ")
    : "Current location";

  return { lat, lng, name };
}

export async function getPrayerTimesForToday(): Promise<PrayerTimesResult> {
  const location = await getCurrentLocation();
  const method = await getPrayerMethod();
  const date = formatDateForAladhan(new Date());
  const cacheKey = getPrayerTodayCacheKey(date, location.lat, location.lng);

  const url =
    `${ALADHAN_BASE_URL}/timings/${date}` +
    `?latitude=${location.lat}&longitude=${location.lng}&method=${method}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch prayer times");
    }

    const payload = (await response.json()) as AladhanResponse;
    if (payload.code !== 200 || !payload.data?.timings) {
      throw new Error("Invalid prayer times response");
    }

    const timings = cleanTimings(payload.data.timings);
    await Promise.all([
      setJsonCache(cacheKey, timings),
      saveLastLocation(location),
    ]);

    return {
      timings,
      location,
      fromCache: false,
    };
  } catch {
    const cached = await getJsonCache<Record<string, string>>(cacheKey);
    if (cached) {
      return {
        timings: cached,
        location,
        fromCache: true,
      };
    }

    throw new Error("Unable to load prayer times");
  }
}
