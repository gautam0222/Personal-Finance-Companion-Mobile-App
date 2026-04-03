import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif-condensed', default: 'System' }),
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};

export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
  display: 48,
};

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
};

export const LetterSpacing = {
  tighter: -0.8,
  tight: -0.4,
  normal: 0,
  wide: 0.4,
  wider: 0.8,
  widest: 1.2,
};

// Pre-built text styles
export const TextStyles = {
  displayLarge: {
    fontSize: FontSize.display,
    fontWeight: '700' as const,
    letterSpacing: LetterSpacing.tighter,
    lineHeight: FontSize.display * LineHeight.tight,
  },
  display: {
    fontSize: FontSize['5xl'],
    fontWeight: '700' as const,
    letterSpacing: LetterSpacing.tighter,
    lineHeight: FontSize['5xl'] * LineHeight.tight,
  },
  h1: {
    fontSize: FontSize['4xl'],
    fontWeight: '700' as const,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize['4xl'] * LineHeight.snug,
  },
  h2: {
    fontSize: FontSize['3xl'],
    fontWeight: '600' as const,
    letterSpacing: LetterSpacing.tight,
    lineHeight: FontSize['3xl'] * LineHeight.snug,
  },
  h3: {
    fontSize: FontSize['2xl'],
    fontWeight: '600' as const,
    letterSpacing: LetterSpacing.tight,
  },
  h4: {
    fontSize: FontSize.xl,
    fontWeight: '600' as const,
    letterSpacing: LetterSpacing.normal,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600' as const,
    letterSpacing: LetterSpacing.normal,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: '400' as const,
    letterSpacing: LetterSpacing.normal,
    lineHeight: FontSize.base * LineHeight.relaxed,
  },
  bodyMedium: {
    fontSize: FontSize.base,
    fontWeight: '500' as const,
    letterSpacing: LetterSpacing.normal,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: '400' as const,
    letterSpacing: LetterSpacing.normal,
  },
  captionBold: {
    fontSize: FontSize.sm,
    fontWeight: '600' as const,
    letterSpacing: LetterSpacing.wide,
  },
  overline: {
    fontSize: FontSize.xs,
    fontWeight: '600' as const,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    fontWeight: '400' as const,
  },
};