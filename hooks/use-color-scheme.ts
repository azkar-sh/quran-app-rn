import { useAppTheme } from "@/providers/app-theme-provider";

export function useColorScheme() {
  const { resolvedScheme } = useAppTheme();
  return resolvedScheme;
}
