import { useColorScheme } from 'react-native';
import { Colors, ColorScheme, Gradients } from '../constants/colors';
import { useAppStore } from '../store/useAppStore';
import { ThemeMode } from '../types';

export interface Theme {
  colors: ColorScheme;
  gradients: typeof Gradients;
  isDark: boolean;
  mode: ThemeMode;
}

export function useTheme(): Theme {
  const settingsTheme = useAppStore((s) => s.settings.theme);
  const systemScheme = useColorScheme();
  const mode: ThemeMode = settingsTheme || (systemScheme === 'light' ? 'light' : 'dark');
  const colors = Colors[mode];

  return {
    colors,
    gradients: Gradients,
    isDark: mode === 'dark',
    mode,
  };
}
