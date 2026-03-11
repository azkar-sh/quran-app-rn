import {
  addReadPage,
  getJsonCache,
  getQuranPageCacheKey,
  setJsonCache,
  setLastReadPage,
} from "@/lib/storage";

const QURAN_BASE_URL = "https://api.myquran.com/v3";

export type QuranAyah = {
  id?: number;
  surah_number?: number;
  ayah_number?: number;
  arab?: string;
  translation?: string;
  image_url?: string;
  surah?: {
    number?: number;
    name?: string;
    name_latin?: string;
    number_of_ayahs?: number;
    translation?: string;
    revelation?: string;
  };
  [key: string]: unknown;
};

type QuranPageResponse = {
  status: boolean;
  meta?: {
    url?: {
      image?: string;
      audio?: string;
    };
  };
  data: QuranAyah[];
};

export type QuranPagePayload = {
  ayahs: QuranAyah[];
  pageImageUrl: string | null;
  pageAudioUrl: string | null;
};

export async function getQuranPage(page: number): Promise<QuranPagePayload> {
  const cacheKey = getQuranPageCacheKey(page);
  const cached = await getJsonCache<QuranPageResponse>(cacheKey);
  if (cached?.status && Array.isArray(cached.data)) {
    return {
      ayahs: cached.data,
      pageImageUrl: cached.meta?.url?.image ?? null,
      pageAudioUrl: cached.meta?.url?.audio ?? null,
    };
  }

  const response = await fetch(`${QURAN_BASE_URL}/quran/page/${page}`);
  if (!response.ok) {
    throw new Error("Failed to fetch Quran page data");
  }

  const payload = (await response.json()) as QuranPageResponse;
  if (!payload.status || !Array.isArray(payload.data)) {
    throw new Error("Invalid Quran page response");
  }

  await setJsonCache(cacheKey, payload);
  return {
    ayahs: payload.data,
    pageImageUrl: payload.meta?.url?.image ?? null,
    pageAudioUrl: payload.meta?.url?.audio ?? null,
  };
}

export async function saveReadingProgress(page: number): Promise<void> {
  await Promise.all([setLastReadPage(page), addReadPage(page)]);
}

export function prefetchQuranBatch(batchStart: number): void {
  const pages = Array.from({ length: 10 }, (_, i) => batchStart + i).filter(
    (p) => p >= 1 && p <= 604,
  );
  for (const p of pages) {
    void getQuranPage(p).catch(() => undefined);
  }
}
