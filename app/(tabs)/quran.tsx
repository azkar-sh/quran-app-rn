import { ScreenHero } from "@/components/screen-hero";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getLastReadPage,
  getQuranArabicFontSize,
  getQuranShowTranslation,
  getQuranTranslationFontSize,
  getQuranViewMode,
  QuranArabicFontSize,
  QuranTranslationFontSize,
  QuranViewMode,
  setQuranArabicFontSize,
  setQuranShowTranslation,
  setQuranTranslationFontSize,
  setQuranViewMode,
} from "@/lib/storage";
import {
  getQuranPage,
  prefetchQuranBatch,
  QuranAyah,
  saveReadingProgress,
} from "@/services/quran";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFonts } from "expo-font";
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
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const MIN_PAGE = 1;
const MAX_PAGE = 604;

const ARABIC_FONT_PRESETS: Record<
  QuranArabicFontSize,
  { fontSize: number; lineHeight: number; label: string }
> = {
  24: { fontSize: 24, lineHeight: 40, label: "24" },
  36: { fontSize: 36, lineHeight: 60, label: "36" },
  48: { fontSize: 48, lineHeight: 80, label: "48" },
};

const TRANSLATION_FONT_PRESETS: Record<
  QuranTranslationFontSize,
  { fontSize: number; lineHeight: number; label: string }
> = {
  14: { fontSize: 14, lineHeight: 20, label: "14" },
  20: { fontSize: 20, lineHeight: 32, label: "20" },
  28: { fontSize: 28, lineHeight: 38, label: "28" },
};

export default function QuranScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [fontsLoaded] = useFonts({
    QuranArabic: require("../../assets/font/quran-arabic.otf"),
  });

  const [page, setPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<QuranViewMode>("ayat");
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [arabicFontSize, setArabicFontSizeState] =
    useState<QuranArabicFontSize>(24);
  const [translationFontSize, setTranslationFontSizeState] =
    useState<QuranTranslationFontSize>(14);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const prefetchedBatches = useRef<Set<number>>(new Set());

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
      const batchStart = Math.floor((bounded - 1) / 10) * 10 + 1;
      if (!prefetchedBatches.current.has(batchStart)) {
        prefetchedBatches.current.add(batchStart);
        prefetchQuranBatch(batchStart);
      }
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
      const [
        savedPage,
        savedViewMode,
        savedShowTranslation,
        savedArabicFontSize,
        savedTranslationFontSize,
      ] = await Promise.all([
        getLastReadPage(),
        getQuranViewMode(),
        getQuranShowTranslation(),
        getQuranArabicFontSize(),
        getQuranTranslationFontSize(),
      ]);
      if (!mounted) return;
      setViewMode(savedViewMode);
      setShowTranslation(savedShowTranslation);
      setArabicFontSizeState(savedArabicFontSize);
      setTranslationFontSizeState(savedTranslationFontSize);
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

  const arabicPreset = ARABIC_FONT_PRESETS[arabicFontSize];
  const translationPreset = TRANSLATION_FONT_PRESETS[translationFontSize];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHero
        title="Quran"
        subtitle={`Page ${page} / 604`}
        badge={viewMode === "page" ? "Mushaf Page View" : "Ayat List View"}
        rightElement={
          <Pressable
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <MaterialIcons name="tune" size={20} color="#FFFFFF" />
          </Pressable>
        }
      ></ScreenHero>

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
              <>
                <Image
                  source={{ uri: pageImageUrl }}
                  style={styles.pageImage}
                  contentFit="contain"
                  transition={150}
                />
              </>
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
                {/* {typeof item.image_url === "string" &&
                item.image_url.length > 0 ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.ayahImage}
                    contentFit="contain"
                    transition={150}
                  />
                ) : null} */}
                {typeof item.arab === "string" ? (
                  <Text
                    style={[
                      styles.arabText,
                      {
                        color: colors.text,
                        fontSize: arabicPreset.fontSize,
                        lineHeight: arabicPreset.lineHeight,
                      },
                      fontsLoaded ? { fontFamily: "QuranArabic" } : null,
                    ]}
                  >
                    {item.arab}{" "}
                    {item.ayah_number && !showTranslation
                      ? `(${item.ayah_number})`
                      : null}
                  </Text>
                ) : null}
                {showTranslation && typeof item.translation === "string" ? (
                  <Text
                    style={[
                      styles.translationText,
                      {
                        color: colors.icon,
                        fontSize: translationPreset.fontSize,
                        lineHeight: translationPreset.lineHeight,
                      },
                    ]}
                  >
                    {item.translation}{" "}
                    {item.ayah_number && showTranslation
                      ? `(${item.ayah_number})`
                      : null}
                  </Text>
                ) : null}
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.bottomNav}>
        {/* Ayah Controls and Jump to Page */}
        <View style={styles.controlsRow}>
          <TextInput
            value={pageInput}
            onChangeText={setPageInput}
            keyboardType="number-pad"
            placeholder="Go to page"
            placeholderTextColor={colors.icon}
            style={[
              styles.pageInput,
              {
                backgroundColor: colorScheme === "dark" ? "#101513" : "#F8FCFA",
                borderColor: colors.tint,
                color: colors.text,
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

        {/* <Text style={styles.swipeHint}>
          Swipe right for next page, left for previous page
        </Text> */}

        <Pressable
          disabled={page <= MIN_PAGE || loading}
          style={[
            styles.navButton,
            { backgroundColor: page <= MIN_PAGE ? "#9BA1A6" : colors.tint },
          ]}
          onPress={goToPreviousPage}
        >
          <Text style={styles.navButtonText}>{"<"}</Text>
        </Pressable>

        <Pressable
          disabled={page >= MAX_PAGE || loading}
          style={[
            styles.navButton,
            { backgroundColor: page >= MAX_PAGE ? "#9BA1A6" : colors.tint },
          ]}
          onPress={goToNextPage}
        >
          <Text style={styles.navButtonText}>{">"}</Text>
        </Pressable>
      </View>

      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSettingsModal(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.background }]}
            onPress={() => {
              /* consume touch so overlay doesn't close */
            }}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Page Settings
              </Text>
              <Pressable onPress={() => setShowSettingsModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.icon} />
              </Pressable>
            </View>

            {/* View Mode */}
            <View style={styles.settingSection}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                View Mode
              </Text>
              <View style={styles.modeRow}>
                <Pressable
                  style={[
                    styles.modeButton,
                    {
                      borderColor:
                        viewMode === "ayat" ? colors.tint : colors.icon,
                      backgroundColor:
                        viewMode === "ayat"
                          ? colors.tint
                          : colorScheme === "dark"
                            ? "#101513"
                            : "#F8FCFA",
                    },
                  ]}
                  onPress={() => {
                    setViewMode("ayat");
                    void setQuranViewMode("ayat");
                  }}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color: viewMode === "ayat" ? "#FFFFFF" : colors.text,
                      },
                    ]}
                  >
                    Ayat List
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modeButton,
                    {
                      borderColor:
                        viewMode === "page" ? colors.tint : colors.icon,
                      backgroundColor:
                        viewMode === "page"
                          ? colors.tint
                          : colorScheme === "dark"
                            ? "#101513"
                            : "#F8FCFA",
                    },
                  ]}
                  onPress={() => {
                    setViewMode("page");
                    void setQuranViewMode("page");
                  }}
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      {
                        color: viewMode === "page" ? "#FFFFFF" : colors.text,
                      },
                    ]}
                  >
                    Quran Page
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Show Translation — only relevant in Ayat List mode */}
            {viewMode === "ayat" ? (
              <>
                <View style={[styles.settingSection, styles.settingRow]}>
                  <View style={styles.settingLabelGroup}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Show Translation
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        { color: colors.icon },
                      ]}
                    >
                      Display Indonesian translation below each verse
                    </Text>
                  </View>
                  <Switch
                    value={showTranslation}
                    onValueChange={(val) => {
                      setShowTranslation(val);
                      void setQuranShowTranslation(val);
                    }}
                    trackColor={{ false: colors.icon, true: colors.tint }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.settingSection}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Arabic Text Size
                  </Text>
                  <Text
                    style={[styles.settingDescription, { color: colors.icon }]}
                  >
                    Choose a preset for larger and easier-to-read Arabic text
                  </Text>
                  <View style={styles.modeRow}>
                    {([24, 36, 48] as const).map((size) => (
                      <Pressable
                        key={size}
                        style={[
                          styles.modeButton,
                          {
                            borderColor:
                              arabicFontSize === size
                                ? colors.tint
                                : colors.icon,
                            backgroundColor:
                              arabicFontSize === size
                                ? colors.tint
                                : colorScheme === "dark"
                                  ? "#101513"
                                  : "#F8FCFA",
                          },
                        ]}
                        onPress={() => {
                          setArabicFontSizeState(size);
                          void setQuranArabicFontSize(size);
                        }}
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            {
                              color:
                                arabicFontSize === size
                                  ? "#FFFFFF"
                                  : colors.text,
                            },
                          ]}
                        >
                          {ARABIC_FONT_PRESETS[size].label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.settingSection}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Translation Text Size
                  </Text>
                  <Text
                    style={[styles.settingDescription, { color: colors.icon }]}
                  >
                    Set translation size separately for better readability
                  </Text>
                  <View style={styles.modeRow}>
                    {([14, 20, 28] as const).map((size) => (
                      <Pressable
                        key={size}
                        style={[
                          styles.modeButton,
                          {
                            borderColor:
                              translationFontSize === size
                                ? colors.tint
                                : colors.icon,
                            backgroundColor:
                              translationFontSize === size
                                ? colors.tint
                                : colorScheme === "dark"
                                  ? "#101513"
                                  : "#F8FCFA",
                          },
                        ]}
                        onPress={() => {
                          setTranslationFontSizeState(size);
                          void setQuranTranslationFontSize(size);
                        }}
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            {
                              color:
                                translationFontSize === size
                                  ? "#FFFFFF"
                                  : colors.text,
                            },
                          ]}
                        >
                          {TRANSLATION_FONT_PRESETS[size].label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  settingsButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    padding: 8,
  },
  controlsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
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
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    borderWidth: 1,
    color: "#FFFFFF",
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  goButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  goButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  swipeHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  pageImageWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 0,
    paddingBottom: 0,
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
    textAlign: "right",
  },
  translationText: {},
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
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 4,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  settingSection: {
    gap: 10,
    paddingVertical: 12,
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  settingLabelGroup: {
    flex: 1,
    paddingRight: 12,
  },
});
