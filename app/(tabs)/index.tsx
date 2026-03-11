import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLastReadPage, getReadPages } from "@/lib/storage";
import { getPrayerTimesForToday } from "@/services/prayer";
import { useFocusEffect } from "expo-router";
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

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPage, setLastPage] = useState(1);
  const [readCount, setReadCount] = useState(0);
  const [locationName, setLocationName] = useState("Unknown location");
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
      const prayerResult = await getPrayerTimesForToday();
      setLocationName(
        prayerResult.fromCache
          ? `${prayerResult.location.name} (cached)`
          : prayerResult.location.name,
      );
      setTimings(prayerResult.timings);
      setPrayerError(null);
    } catch (error) {
      setPrayerError(
        error instanceof Error
          ? error.message
          : "Unable to load prayer schedule",
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        setLoading(true);
        await loadScreenData();
        if (mounted) {
          setLoading(false);
        }
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

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>Home</Text>

      <View
        style={[
          styles.card,
          {
            borderColor: colors.tint,
            backgroundColor: colorScheme === "dark" ? "#102016" : "#F4FBF6",
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Continue Reading
        </Text>
        <Text style={[styles.cardValue, { color: colors.tint }]}>
          Page {lastPage}
        </Text>
        <Text style={[styles.cardSubtext, { color: colors.icon }]}>
          {readCount} of 604 pages read ({progressPercent}%)
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            borderColor: colors.tint,
            backgroundColor: colorScheme === "dark" ? "#101513" : "#F8FCFA",
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Today&apos;s Prayer Times
        </Text>
        <Text style={[styles.cardSubtext, { color: colors.icon }]}>
          {locationName}
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.tint} style={styles.loader} />
        ) : prayerError ? (
          <Text style={[styles.errorText, { color: "#C03A2B" }]}>
            {prayerError}
          </Text>
        ) : (
          <View style={styles.timingsList}>
            {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((name) => (
              <View key={name} style={styles.timeRow}>
                <Text style={[styles.timeName, { color: colors.text }]}>
                  {name}
                </Text>
                <Text style={[styles.timeValue, { color: colors.tint }]}>
                  {timings[name] ?? "-"}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.refreshButton, { backgroundColor: colors.tint }]}
          onPress={onRefresh}
        >
          <Text style={styles.refreshButtonText}>Refresh prayer times</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  cardSubtext: {
    fontSize: 14,
  },
  timingsList: {
    marginTop: 8,
    gap: 8,
  },
  timeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeName: {
    fontSize: 16,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  refreshButton: {
    alignItems: "center",
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  loader: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
});
