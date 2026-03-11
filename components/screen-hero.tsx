import { useColorScheme } from "@/hooks/use-color-scheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Pattern, Polygon, Rect } from "react-native-svg";

type ScreenHeroProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
  onTitlePress?: () => void;
};

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
          id="screen-hero-islamic-star"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          {/* outer square */}
          <Polygon
            points="10,10 70,10 70,70 10,70"
            fill="none"
            stroke="white"
            strokeWidth={0.8}
            strokeOpacity={0.08}
          />

          {/* diamond */}
          <Polygon
            points="40,0 80,40 40,80 0,40"
            fill="none"
            stroke="white"
            strokeWidth={0.8}
            strokeOpacity={0.08}
          />
        </Pattern>
      </Defs>

      <Rect width="100%" height="100%" fill="url(#screen-hero-islamic-star)" />
    </Svg>
  );
}

export function ScreenHero({
  title,
  subtitle,
  badge,
  rightElement,
  children,
  onTitlePress,
}: ScreenHeroProps) {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const heroGradient =
    colorScheme === "dark"
      ? (["#040C07", "#091A0E", "#0E2718"] as const)
      : (["#0B5C2E", "#1D8F4E", "#34C175"] as const);

  return (
    <LinearGradient
      colors={heroGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + 20 }]}
    >
      <IslamicPatternOverlay />

      {badge ? (
        <View style={styles.badgeRow}>
          <MaterialIcons
            name="auto-awesome"
            size={14}
            color="rgba(255,255,255,0.75)"
          />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      <View style={styles.titleRow}>
        {onTitlePress ? (
          <Pressable style={styles.titleGroup} onPress={onTitlePress}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>{subtitle}</Text>
                <MaterialIcons
                  name="expand-more"
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </View>
            ) : null}
          </Pressable>
        ) : (
          <View style={styles.titleGroup}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        )}
        {rightElement ? (
          <View style={styles.rightWrap}>{rightElement}</View>
        ) : null}
      </View>

      {children ? <View style={styles.content}>{children}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 10,
    overflow: "hidden",
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  badgeText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  titleGroup: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },
  subtitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  rightWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: 10,
  },
});
