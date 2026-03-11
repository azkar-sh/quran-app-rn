import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLastReadPage } from "@/lib/storage";
import { getQuranPage, QuranAyah, saveReadingProgress } from "@/services/quran";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MIN_PAGE = 1;
const MAX_PAGE = 604;
type QuranViewMode = "ayat" | "page";

export default function QuranScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [page, setPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<QuranViewMode>("ayat");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (nextPage: number) => {
    const bounded = Math.max(MIN_PAGE, Math.min(MAX_PAGE, nextPage));
    setLoading(true);
    setError(null);

    try {
      const payload = await getQuranPage(bounded);
      setAyahs(payload.ayahs);
      setPageImageUrl(payload.pageImageUrl);
      setPage(bounded);
      setPageInput(String(bounded));
      await saveReadingProgress(bounded);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Quran page",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const savedPage = await getLastReadPage();
      if (!mounted) {
        return;
      }
      await loadPage(savedPage);
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [loadPage]);

  const goToNextPage = useCallback(() => {
    if (page < MAX_PAGE) {
      void loadPage(page + 1);
    }
  }, [loadPage, page]);

  const goToPreviousPage = useCallback(() => {
    if (page > MIN_PAGE) {
      void loadPage(page - 1);
    }
  }, [loadPage, page]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 60,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx >= 45) {
            goToNextPage();
            return;
          }

          if (gestureState.dx <= -45) {
            goToPreviousPage();
          }
        },
      }),
    [goToNextPage, goToPreviousPage],
  );

  const listRef = useRef<FlatList<QuranAyah>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);

  const onGoToPage = useCallback(() => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(page));
      return;
    }

    const next = Math.max(MIN_PAGE, Math.min(MAX_PAGE, Math.floor(parsed)));
    void loadPage(next);
  }, [loadPage, page, pageInput]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Quran</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Page {page} / 604
        </Text>

        <View style={styles.controlsRow}>
          <TextInput
            value={pageInput}
            onChangeText={setPageInput}
            keyboardType="number-pad"
            placeholder="Page"
            placeholderTextColor={colors.icon}
            style={[
              styles.pageInput,
              {
                borderColor: colors.tint,
                color: colors.text,
                backgroundColor: colorScheme === "dark" ? "#101513" : "#F8FCFA",
              },
            ]}
          />
          <Pressable
            style={[styles.goButton, { backgroundColor: colors.tint }]}
            onPress={onGoToPage}
          >
            <Text style={styles.goButtonText}>Go</Text>
          </Pressable>
        </View>

        <View style={styles.modeRow}>
          <Pressable
            style={[
              styles.modeButton,
              {
                borderColor: viewMode === "ayat" ? colors.tint : colors.icon,
                backgroundColor:
                  viewMode === "ayat"
                    ? colors.tint
                    : colorScheme === "dark"
                      ? "#101513"
                      : "#F8FCFA",
              },
            ]}
            onPress={() => setViewMode("ayat")}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: viewMode === "ayat" ? "#FFFFFF" : colors.text },
              ]}
            >
              Ayat List
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              {
                borderColor: viewMode === "page" ? colors.tint : colors.icon,
                backgroundColor:
                  viewMode === "page"
                    ? colors.tint
                    : colorScheme === "dark"
                      ? "#101513"
                      : "#F8FCFA",
              },
            ]}
            onPress={() => setViewMode("page")}
          >
            <Text
              style={[
                styles.modeButtonText,
                { color: viewMode === "page" ? "#FFFFFF" : colors.text },
              ]}
            >
              Quran Page
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.swipeHintWrap}>
        <Text style={[styles.swipeHint, { color: colors.icon }]}>
          Swipe right for next page, left for previous page
        </Text>
      </View>

      <View style={styles.content} {...panResponder.panHandlers}>
        {loading ? (
          <ActivityIndicator
            color={colors.tint}
            size="large"
            style={styles.loader}
          />
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
              onPress={() => void loadPage(page)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : viewMode === "page" ? (
          <View style={styles.pageImageWrap}>
            {typeof pageImageUrl === "string" && pageImageUrl.length > 0 ? (
              <Image
                source={{ uri: pageImageUrl }}
                style={styles.pageImage}
                contentFit="contain"
                transition={150}
              />
            ) : (
              <Text style={[styles.pageImageFallback, { color: colors.icon }]}>
                Page image is not available for this page.
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={ayahs}
            keyExtractor={(item, index) => `${item.id ?? "ayah"}-${index}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.ayahCard,
                  {
                    borderColor: colors.tint,
                    backgroundColor:
                      colorScheme === "dark" ? "#101513" : "#F8FCFA",
                  },
                ]}
              >
                {typeof item.image_url === "string" &&
                item.image_url.length > 0 ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.ayahImage}
                    contentFit="contain"
                    transition={150}
                  />
                ) : null}
                {typeof item.arab === "string" ? (
                  <Text style={[styles.arabText, { color: colors.text }]}>
                    {item.arab}
                  </Text>
                ) : null}
                {typeof item.translation === "string" ? (
                  <Text
                    style={[styles.translationText, { color: colors.icon }]}
                  >
                    {item.translation}
                  </Text>
                ) : null}
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.bottomNav}>
        <Pressable
          disabled={page <= MIN_PAGE || loading}
          style={[
            styles.navButton,
            { backgroundColor: page <= MIN_PAGE ? "#9BA1A6" : colors.tint },
          ]}
          onPress={goToPreviousPage}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </Pressable>

        <Pressable
          disabled={page >= MAX_PAGE || loading}
          style={[
            styles.navButton,
            { backgroundColor: page >= MAX_PAGE ? "#9BA1A6" : colors.tint },
          ]}
          onPress={goToNextPage}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  controlsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
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
  pageInput: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  goButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  swipeHintWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  swipeHint: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  pageImageWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    paddingBottom: 120,
  },
  pageImage: {
    height: "100%",
    width: "100%",
  },
  pageImageFallback: {
    fontSize: 14,
    textAlign: "center",
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 120,
  },
  ayahCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  ayahImage: {
    borderRadius: 8,
    height: 220,
    width: "100%",
  },
  arabText: {
    fontSize: 24,
    lineHeight: 36,
    textAlign: "right",
  },
  translationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorWrap: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  errorText: {
    color: "#C03A2B",
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 10,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  bottomNav: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    padding: 12,
  },
  navButton: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
  },
  navButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
