import {
  getJsonCache,
  getLastLocation,
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

type PrayerDailyCache = {
  timings: Record<string, string>;
  location: SavedLocation;
};

type GetPrayerTimesOptions = {
  forceRefresh?: boolean;
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

function getPrayerDailyCacheKey(date: string, method: number): string {
  return `prayer.daily.${date}.method.${method}`;
}

export async function getPrayerTimesForToday(
  options: GetPrayerTimesOptions = {},
): Promise<PrayerTimesResult> {
  const { forceRefresh = false } = options;
  const method = await getPrayerMethod();
  const date = formatDateForAladhan(new Date());
  const dailyCacheKey = getPrayerDailyCacheKey(date, method);

  if (!forceRefresh) {
    const dailyCached = await getJsonCache<PrayerDailyCache>(dailyCacheKey);
    if (dailyCached?.timings && dailyCached?.location) {
      return {
        timings: dailyCached.timings,
        location: dailyCached.location,
        fromCache: true,
      };
    }
  }

  const location = await getCurrentLocation();
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
    const dailyPayload: PrayerDailyCache = { timings, location };
    await Promise.all([
      setJsonCache(cacheKey, timings),
      setJsonCache(dailyCacheKey, dailyPayload),
      saveLastLocation(location),
    ]);

    return {
      timings,
      location,
      fromCache: false,
    };
  } catch {
    const dailyCached = await getJsonCache<PrayerDailyCache>(dailyCacheKey);
    if (dailyCached?.timings && dailyCached?.location) {
      return {
        timings: dailyCached.timings,
        location: dailyCached.location,
        fromCache: true,
      };
    }

    const cached = await getJsonCache<Record<string, string>>(cacheKey);
    if (cached) {
      return {
        timings: cached,
        location,
        fromCache: true,
      };
    }

    const lastLocation = await getLastLocation();
    if (lastLocation) {
      const lastLocationKey = getPrayerTodayCacheKey(
        date,
        lastLocation.lat,
        lastLocation.lng,
      );
      const cachedByLastLocation =
        await getJsonCache<Record<string, string>>(lastLocationKey);
      if (cachedByLastLocation) {
        return {
          timings: cachedByLastLocation,
          location: lastLocation,
          fromCache: true,
        };
      }
    }

    throw new Error("Unable to load prayer times");
  }
}
