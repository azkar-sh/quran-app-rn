import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLastReadPage, getReadPages } from "@/lib/storage";
import { getSurahNameForPage } from "@/lib/surah-pages";
import { getPrayerTimesForToday } from "@/services/prayer";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Pattern, Polygon, Rect } from "react-native-svg";

// ─────────────────────────── Constants & helpers ───────────────────────────

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type PrayerName = (typeof PRAYER_ORDER)[number];

const PRAYER_META: Record<PrayerName, { icon: string }> = {
  Fajr: { icon: "nights_stay" },
  Dhuhr: { icon: "wb_sunny" },
  Asr: { icon: "light_mode" },
  Maghrib: { icon: "flare" },
  Isha: { icon: "dark_mode" },
};

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getActivePrayerInfo(timings: Record<string, string>): {
  current: PrayerName;
  next: PrayerName | null;
  countdown: string;
} {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let current: PrayerName = "Isha";
  let next: PrayerName | null = null;

  for (const prayer of PRAYER_ORDER) {
    const t = timings[prayer];
    if (!t) continue;
    if (parseMinutes(t) <= nowMins) {
      current = prayer;
    } else if (!next) {
      next = prayer;
    }
  }

  let countdown = "";
  if (next && timings[next]) {
    const diffMins = parseMinutes(timings[next]) - nowMins;
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
  return { current, next, countdown };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 15) return "Good Afternoon";
  if (hour < 19) return "Good Evening";
  return "Good Night";
}

// ─────────────────────────── Sub-components ───────────────────────────────

function IslamicPatternOverlay() {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id="islamic-star"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <Polygon
            points="40,5 46,26 65,15 54,34 75,40 54,46 65,65 46,54 40,75 34,54 15,65 26,46 5,40 26,34 15,15 34,26"
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            strokeOpacity={0.12}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#islamic-star)" />
    </Svg>
  );
}

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0–1
  color: string;
  trackColor: string;
}

function CircularProgress({
  size,
  strokeWidth,
  progress,
  color,
  trackColor,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90, ${cx}, ${cy})`}
      />
    </Svg>
  );
}

interface PrayerCardProps {
  name: PrayerName;
  time: string;
  isActive: boolean;
  isNext: boolean;
  colorScheme: "light" | "dark";
  colors: (typeof Colors)["light"];
}

function PrayerCard({
  name,
  time,
  isActive,
  isNext,
  colorScheme,
  colors,
}: PrayerCardProps) {
  const bgColor = isActive
    ? colors.tint
    : isNext
      ? colorScheme === "dark"
        ? "#132A1C"
        : "#FFFFFF"
      : colorScheme === "dark"
        ? "#101513"
        : "#F4FBF6";

  const borderColor = isActive
    ? "transparent"
    : isNext
      ? colors.tint
      : colorScheme === "dark"
        ? "#1A2820"
        : "#DFF0E5";

  const textColor = isActive ? "#FFFFFF" : colors.text;
  const timeColor = isActive ? "#FFFFFF" : colors.tint;
  const iconColor = isActive ? "#FFFFFF" : isNext ? colors.tint : colors.icon;

  return (
    <View
      style={[
        styles.prayerCard,
        {
          backgroundColor: bgColor,
          borderColor,
          shadowColor: isNext || isActive ? colors.tint : "transparent",
          shadowOffset: { width: 0, height: isNext ? 6 : 3 },
          shadowOpacity: isNext ? 0.25 : isActive ? 0.2 : 0,
          shadowRadius: isNext ? 12 : 8,
          elevation: isNext ? 5 : isActive ? 4 : 0,
        },
      ]}
    >
      {isNext ? (
        <View style={[styles.nextBadge, { backgroundColor: colors.tint }]}>
          <Text style={styles.nextBadgeText}>Next</Text>
        </View>
      ) : null}
      <MaterialIcons
        name={
          PRAYER_META[name].icon as React.ComponentProps<
            typeof MaterialIcons
          >["name"]
        }
        size={20}
        color={iconColor}
      />
      <Text style={[styles.prayerCardName, { color: textColor }]}>{name}</Text>
      <Text
        style={[
          styles.prayerCardTime,
          { color: timeColor, fontWeight: isActive || isNext ? "700" : "500" },
        ]}
      >
        {time}
      </Text>
    </View>
  );
}

// ─────────────────────────── Main screen ──────────────────────────────────

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPage, setLastPage] = useState(1);
  const [readCount, setReadCount] = useState(0);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [timings, setTimings] = useState<Record<string, string>>({});
  const [prayerError, setPrayerError] = useState<string | null>(null);

  const loadScreenData = useCallback(async () => {
    const [savedPage, readPages] = await Promise.all([
      getLastReadPage(),
      getReadPages(),
    ]);
    setLastPage(savedPage);
    setReadCount(readPages.length);

    try {
      const result = await getPrayerTimesForToday();
      setLocationName(
        result.fromCache
          ? `${result.location.name} (cached)`
          : result.location.name,
      );
      setTimings(result.timings);
      setPrayerError(null);
    } catch (err) {
      setPrayerError(
        err instanceof Error ? err.message : "Unable to load prayer schedule",
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        setLoading(true);
        await loadScreenData();
        if (mounted) setLoading(false);
      };
      void load();
      return () => {
        mounted = false;
      };
    }, [loadScreenData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScreenData();
    setRefreshing(false);
  }, [loadScreenData]);

  const progressPercent = Math.min(100, Math.round((readCount / 604) * 100));
  const surahName = getSurahNameForPage(lastPage);

  const greeting = getGreeting();
  const { current, next, countdown } = getActivePrayerInfo(timings);
  const hasPrayerData = Object.keys(timings).length > 0;

  // Gradient colors
  const heroGradient =
    colorScheme === "dark"
      ? (["#040C07", "#091A0E", "#0E2718"] as const)
      : (["#0B5C2E", "#1D8F4E", "#34C175"] as const);

  const cardBg = colorScheme === "dark" ? "#0C1810" : "#FFFFFF";
  const cardBorder = colorScheme === "dark" ? "#1A2E20" : "#E0F2E9";
  const trackColor = colorScheme === "dark" ? "#1A2820" : "#D0EDD9";

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
        />
      }
    >
      {/* ── Hero Header ── */}
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 20 }]}
      >
        <IslamicPatternOverlay />

        {/* Location */}
        {locationName ? (
          <View style={styles.locationRow}>
            <MaterialIcons
              name="location-on"
              size={14}
              color="rgba(255,255,255,0.75)"
            />
            <Text style={styles.locationText}>{locationName}</Text>
          </View>
        ) : null}

        {/* Greeting */}
        <Text style={styles.heroGreeting}>{greeting}</Text>

        {/* Next prayer countdown */}
        {hasPrayerData && next && countdown ? (
          <View style={styles.countdownRow}>
            <MaterialIcons
              name="access-time"
              size={14}
              color="rgba(255,255,255,0.85)"
            />
            <Text style={styles.countdownText}>
              Time until {next}: {countdown}
            </Text>
          </View>
        ) : hasPrayerData ? (
          <Text style={styles.countdownText}>All prayers completed today</Text>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        {/* ── Reading Progress Card ── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: colors.tint,
            },
          ]}
        >
          <View style={styles.progressRow}>
            {/* Circular ring */}
            <View style={styles.ringWrap}>
              <CircularProgress
                size={92}
                strokeWidth={7}
                progress={progressPercent / 100}
                color={colors.tint}
                trackColor={trackColor}
              />
              <View style={styles.ringCenter}>
                <Text style={[styles.ringPercent, { color: colors.tint }]}>
                  {progressPercent}%
                </Text>
              </View>
            </View>

            {/* Info */}
            <View style={styles.progressInfo}>
              <Text style={[styles.cardLabel, { color: colors.icon }]}>
                Continue Reading
              </Text>
              <Text style={[styles.progressPage, { color: colors.text }]}>
                Page {lastPage}
              </Text>
              <Text
                style={[styles.progressSurah, { color: colors.tint }]}
                numberOfLines={1}
              >
                {surahName}
              </Text>
              <Text style={[styles.progressCount, { color: colors.icon }]}>
                {readCount} of 604 pages read
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.continueButton, { backgroundColor: colors.tint }]}
            onPress={() => router.navigate("/(tabs)/quran")}
          >
            <Text style={styles.continueButtonText}>Continue Reading</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Prayer Times Card ── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: colors.tint,
            },
          ]}
        >
          <View style={styles.prayerHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Today&apos;s Prayers
            </Text>
            <Pressable onPress={onRefresh} hitSlop={8}>
              <MaterialIcons name="refresh" size={20} color={colors.icon} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.tint} style={styles.loader} />
          ) : prayerError ? (
            <View style={styles.errorWrap}>
              <MaterialIcons name="wifi-off" size={24} color={colors.icon} />
              <Text style={[styles.errorText, { color: colors.icon }]}>
                {prayerError}
              </Text>
              <Pressable
                style={[styles.retryBtn, { borderColor: colors.tint }]}
                onPress={onRefresh}
              >
                <Text style={[styles.retryBtnText, { color: colors.tint }]}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prayerScroll}
            >
              {PRAYER_ORDER.map((name) => (
                <PrayerCard
                  key={name}
                  name={name}
                  time={timings[name] ?? "-"}
                  isActive={current === name}
                  isNext={next === name}
                  colorScheme={colorScheme}
                  colors={colors}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // ── Hero
  hero: {
    gap: 6,
    overflow: "hidden",
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginBottom: 2,
  },
  locationText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  heroGreeting: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  countdownRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 2,
  },
  countdownText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },
  // ── Body
  body: {
    gap: 16,
    padding: 16,
  },
  // ── Cards
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    overflow: "hidden",
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  // ── Progress
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
  ringWrap: {
    position: "relative",
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPercent: {
    fontSize: 15,
    fontWeight: "800",
  },
  progressInfo: {
    flex: 1,
    gap: 2,
  },
  progressPage: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 30,
  },
  progressSurah: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressCount: {
    fontSize: 12,
    marginTop: 2,
  },
  continueButton: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 12,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  // ── Prayer times
  prayerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prayerScroll: {
    gap: 10,
    paddingBottom: 4,
    paddingTop: 2,
  },
  prayerCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    minWidth: 80,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 14,
    position: "relative",
  },
  prayerCardName: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  prayerCardTime: {
    fontSize: 13,
  },
  nextBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
    top: 6,
    right: 6,
  },
  nextBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  // ── Error / loader
  loader: {
    marginVertical: 16,
  },
  errorWrap: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
