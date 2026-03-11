import { getThemeMode, setThemeMode, ThemeMode } from "@/lib/storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";

type AppThemeContextValue = {
  mode: ThemeMode;
  resolvedScheme: "light" | "dark";
  ready: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const nativeScheme = useNativeColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMode = async () => {
      const savedMode = await getThemeMode();
      if (!mounted) {
        return;
      }

      setModeState(savedMode);
      setReady(true);
    };

    void loadMode();

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedScheme: "light" | "dark" =
    mode === "system" ? (nativeScheme === "dark" ? "dark" : "light") : mode;

  const value = useMemo<AppThemeContextValue>(
    () => ({
      mode,
      resolvedScheme,
      ready,
      setMode: async (nextMode) => {
        setModeState(nextMode);
        await setThemeMode(nextMode);
      },
    }),
    [mode, resolvedScheme, ready],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }

  return context;
}
