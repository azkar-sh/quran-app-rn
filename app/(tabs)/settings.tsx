import { ScreenHero } from "@/components/screen-hero";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  clearQuranPageCache,
  clearReadingProgress,
  getPrayerMethod,
  setPrayerMethod,
  ThemeMode,
} from "@/lib/storage";
import { useAppTheme } from "@/providers/app-theme-provider";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { mode, setMode } = useAppTheme();

  const [working, setWorking] = useState(false);
  const [prayerMethod, setPrayerMethodState] = useState<number>(20);
  const [locationStatus, setLocationStatus] = useState("Unknown");

  useEffect(() => {
    const load = async () => {
      const method = await getPrayerMethod();
      setPrayerMethodState(method);
      await refreshLocationStatus();
    };

    void load();
  }, []);

  const refreshLocationStatus = async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status === "granted") {
      setLocationStatus("Granted");
      return;
    }

    if (permission.status === "denied") {
      setLocationStatus("Denied");
      return;
    }

    setLocationStatus("Not requested");
  };

  const onSetMode = async (nextMode: ThemeMode) => {
    await setMode(nextMode);
  };

  const onClearProgress = async () => {
    setWorking(true);
    await clearReadingProgress();
    setWorking(false);
    Alert.alert("Done", "Reading progress has been cleared.");
  };

  const onClearQuranCache = async () => {
    setWorking(true);
    await clearQuranPageCache();
    setWorking(false);
    Alert.alert("Done", "Cached Quran pages have been cleared.");
  };

  const onSetPrayerMethod = async (method: number) => {
    setPrayerMethodState(method);
    await setPrayerMethod(method);
  };

  const optionButton = (value: ThemeMode, label: string) => (
    <Pressable
      key={value}
      onPress={() => void onSetMode(value)}
      style={[
        styles.modeButton,
        {
          borderColor: mode === value ? colors.tint : colors.icon,
          backgroundColor: mode === value ? colors.tint : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.modeButtonText,
          { color: mode === value ? "#FFFFFF" : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const prayerMethodButton = (value: number, label: string) => (
    <Pressable
      key={value}
      onPress={() => void onSetPrayerMethod(value)}
      style={[
        styles.modeButton,
        {
          borderColor: prayerMethod === value ? colors.tint : colors.icon,
          backgroundColor: prayerMethod === value ? colors.tint : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.modeButtonText,
          { color: prayerMethod === value ? "#FFFFFF" : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHero
        title="Settings"
        subtitle="Theme, prayer, location, and cached reading data"
        badge="Personalization"
      />

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
          Theme Mode
        </Text>
        <View style={styles.modeRow}>
          {optionButton("system", "System")}
          {optionButton("light", "Light")}
          {optionButton("dark", "Dark")}
        </View>
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
        <Text style={[styles.cardTitle, { color: colors.text }]}>Data</Text>

        <Pressable
          disabled={working}
          onPress={() => void onClearProgress()}
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.actionButtonText}>Clear reading progress</Text>
        </Pressable>

        <Pressable
          disabled={working}
          onPress={() => void onClearQuranCache()}
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
        >
          <Text style={styles.actionButtonText}>Clear Quran cache</Text>
        </Pressable>
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
          Prayer Calculation Method
        </Text>
        <View style={styles.modeRow}>
          {prayerMethodButton(20, "KEMENAG")}
          {prayerMethodButton(3, "MWL")}
          {prayerMethodButton(4, "Umm Al-Qura")}
        </View>
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
          Location Permission
        </Text>
        <Text style={{ color: colors.icon }}>Status: {locationStatus}</Text>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={() => void refreshLocationStatus()}
        >
          <Text style={styles.actionButtonText}>Refresh status</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
