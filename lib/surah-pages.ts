/**
 * Page → Surah name lookup for the standard Madinah Mushaf (604 pages).
 * Each tuple is [firstPageOfSurah, surahName, surahMeaning].
 * The array is sorted ascending by page number.
 */
const SURAH_PAGE_MAP: readonly [number, string, string][] = [
  [1, "Al-Fatihah", "Pembukaan"],
  [2, "Al-Baqarah", "Sapi Betina"],
  [50, "Ali 'Imran", "Keluarga Imran"],
  [77, "An-Nisa'", "Wanita"],
  [106, "Al-Ma'idah", "Hidangan"],
  [128, "Al-An'am", "Binatang Ternak"],
  [151, "Al-A'raf", "Tempat yang Tertinggi"],
  [177, "Al-Anfal", "Rampasan Perang"],
  [187, "At-Tawbah", "Tobat"],
  [208, "Yunus", "Yunus"],
  [221, "Hud", "Hud"],
  [235, "Yusuf", "Yusuf"],
  [249, "Ar-Ra'd", "Guruh"],
  [255, "Ibrahim", "Ibrahim"],
  [262, "Al-Hijr", "Negeri Hijr"],
  [267, "An-Nahl", "Lebah"],
  [282, "Al-Isra'", "Perjalanan Malam"],
  [293, "Al-Kahf", "Gua"],
  [305, "Maryam", "Maryam"],
  [312, "Ta-Ha", "Ta Ha"],
  [322, "Al-Anbiya'", "Para Nabi"],
  [333, "Al-Hajj", "Haji"],
  [342, "Al-Mu'minun", "Orang-Orang Mukmin"],
  [350, "An-Nur", "Cahaya"],
  [359, "Al-Furqan", "Pembeda"],
  [367, "Ash-Shu'ara'", "Para Penyair"],
  [377, "An-Naml", "Semut"],
  [385, "Al-Qasas", "Kisah-Kisah"],
  [396, "Al-'Ankabut", "Laba-Laba"],
  [404, "Ar-Rum", "Bangsa Romawi"],
  [411, "Luqman", "Luqman"],
  [415, "As-Sajdah", "Sujud"],
  [418, "Al-Ahzab", "Golongan yang Bersekutu"],
  [428, "Saba'", "Saba"],
  [434, "Fatir", "Pencipta"],
  [440, "Ya-Sin", "Ya Sin"],
  [446, "As-Saffat", "Yang Bersaf-Saf"],
  [453, "Sad", "Sad"],
  [458, "Az-Zumar", "Rombongan-Rombongan"],
  [467, "Ghafir", "Yang Mengampuni"],
  [477, "Fussilat", "Yang Dijelaskan"],
  [483, "Ash-Shura", "Musyawarah"],
  [489, "Az-Zukhruf", "Perhiasan"],
  [496, "Ad-Dukhan", "Kabut"],
  [499, "Al-Jathiyah", "Yang Berlutut"],
  [502, "Al-Ahqaf", "Bukit-Bukit Pasir"],
  [507, "Muhammad", "Muhammad"],
  [511, "Al-Fath", "Kemenangan"],
  [515, "Al-Hujurat", "Kamar-Kamar"],
  [518, "Qaf", "Qaf"],
  [520, "Adh-Dhariyat", "Angin yang Menerbangkan"],
  [523, "At-Tur", "Bukit"],
  [526, "An-Najm", "Bintang"],
  [528, "Al-Qamar", "Bulan"],
  [531, "Ar-Rahman", "Yang Maha Pengasih"],
  [534, "Al-Waqi'ah", "Hari Kiamat"],
  [537, "Al-Hadid", "Besi"],
  [542, "Al-Mujadilah", "Gugatan"],
  [545, "Al-Hashr", "Pengusiran"],
  [549, "Al-Mumtahanah", "Wanita yang Diuji"],
  [551, "As-Saf", "Barisan"],
  [553, "Al-Jumu'ah", "Jumat"],
  [554, "Al-Munafiqun", "Orang-Orang Munafik"],
  [556, "At-Taghabun", "Hari Ditampakkan Kesalahan"],
  [558, "At-Talaq", "Talak"],
  [560, "At-Tahrim", "Pengharaman"],
  [562, "Al-Mulk", "Kerajaan"],
  [564, "Al-Qalam", "Pena"],
  [566, "Al-Haqqah", "Hari Kiamat"],
  [568, "Al-Ma'arij", "Tempat Naik"],
  [570, "Nuh", "Nuh"],
  [572, "Al-Jinn", "Jin"],
  [574, "Al-Muzzammil", "Orang yang Berselimut"],
  [575, "Al-Muddaththir", "Orang yang Berkemul"],
  [577, "Al-Qiyamah", "Kiamat"],
  [578, "Al-Insan", "Manusia"],
  [580, "Al-Mursalat", "Malaikat yang Diutus"],
  [582, "An-Naba'", "Berita Besar"],
  [583, "An-Nazi'at", "Malaikat yang Mencabut"],
  [585, "'Abasa", "Ia Bermuka Masam"],
  [586, "At-Takwir", "Penggulungan"],
  [587, "Al-Infitar", "Terbelah"],
  [587, "Al-Mutaffifin", "Orang-Orang Curang"],
  [589, "Al-Inshiqaq", "Terbelah"],
  [590, "Al-Buruj", "Gugusan Bintang"],
  [591, "At-Tariq", "Yang Datang di Malam Hari"],
  [591, "Al-A'la", "Yang Paling Tinggi"],
  [592, "Al-Ghashiyah", "Hari Kiamat"],
  [593, "Al-Fajr", "Fajar"],
  [594, "Al-Balad", "Negeri"],
  [595, "Ash-Shams", "Matahari"],
  [595, "Al-Layl", "Malam"],
  [596, "Ad-Duha", "Waktu Duha"],
  [596, "Ash-Sharh", "Lapang"],
  [597, "At-Tin", "Buah Tin"],
  [597, "Al-'Alaq", "Segumpal Darah"],
  [598, "Al-Qadr", "Kemuliaan"],
  [598, "Al-Bayyinah", "Bukti Nyata"],
  [599, "Az-Zalzalah", "Guncangan"],
  [599, "Al-'Adiyat", "Kuda Perang yang Berlari Kencang"],
  [600, "Al-Qari'ah", "Hari Kiamat"],
  [600, "At-Takathur", "Bermegah-Megahan"],
  [601, "Al-'Asr", "Masa"],
  [601, "Al-Humazah", "Pengumpat"],
  [601, "Al-Fil", "Gajah"],
  [602, "Quraish", "Quraisy"],
  [602, "Al-Ma'un", "Barang-Barang yang Berguna"],
  [602, "Al-Kawthar", "Nikmat yang Banyak"],
  [603, "Al-Kafirun", "Orang-Orang Kafir"],
  [603, "An-Nasr", "Pertolongan"],
  [603, "Al-Masad", "Gejolak Api"],
  [604, "Al-Ikhlas", "Ikhlas"],
  [604, "Al-Falaq", "Waktu Subuh"],
  [604, "An-Nas", "Manusia"],
] as const;

/**
 * Returns the name of the surah on or nearest before the given page (1–604).
 */
export function getSurahNameForPage(page: number): string {
  let result: string = SURAH_PAGE_MAP[0][1];
  for (const [startPage, name] of SURAH_PAGE_MAP) {
    if (startPage <= page) {
      result = name;
    } else {
      break;
    }
  }
  return result;
}

/**
 * Returns surah name and meaning on or nearest before the given page (1-604).
 */
export function getSurahInfoForPage(page: number): {
  name: string;
  meaning: string;
} {
  let result = {
    name: SURAH_PAGE_MAP[0][1],
    meaning: SURAH_PAGE_MAP[0][2],
  };

  for (const [startPage, name, meaning] of SURAH_PAGE_MAP) {
    if (startPage <= page) {
      result = { name, meaning };
    } else {
      break;
    }
  }

  return result;
}
