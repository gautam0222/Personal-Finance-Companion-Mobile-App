import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

type BadgeVariant = 'income' | 'expense' | 'primary' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  size = 'md',
}) => {
  const { colors } = useTheme();

  const configs: Record<BadgeVariant, { bg: string; text: string }> = {
    income:  { bg: colors.incomeMuted,   text: colors.incomeText },
    expense: { bg: colors.expenseMuted,  text: colors.expenseText },
    primary: { bg: colors.primaryMuted,  text: colors.primaryLight },
    warning: { bg: colors.warningMuted,  text: colors.warning },
    neutral: { bg: colors.cardElevated,  text: colors.textSecondary },
  };

  const { bg, text } = configs[variant];

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: Radius.full,
          paddingHorizontal: size === 'sm' ? Spacing[2] : Spacing[3],
          paddingVertical: size === 'sm' ? 2 : Spacing[1],
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          fontSize: size === 'sm' ? FontSize.xs : FontSize.sm,
          fontWeight: '600',
          color: text,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ─── Color Dot ────────────────────────────────────────────────────────────────
interface DotProps {
  color: string;
  size?: number;
  style?: ViewStyle;
}

export const ColorDot: React.FC<DotProps> = ({ color, size = 8, style }) => (
  <View
    style={[
      { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      style,
    ]}
  />
);

// ─── Category Tag ─────────────────────────────────────────────────────────────
interface TagProps {
  icon: string;
  label: string;
  color: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export const CategoryTag: React.FC<TagProps> = ({
  icon,
  label,
  color,
  style,
  size = 'md',
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: size === 'sm' ? 4 : Spacing[1.5],
          backgroundColor: `${color}18`,
          borderRadius: Radius.full,
          paddingHorizontal: size === 'sm' ? Spacing[2] : Spacing[3],
          paddingVertical: size === 'sm' ? 3 : Spacing[1],
        },
        style,
      ]}
    >
      <Text style={{ fontSize: size === 'sm' ? 11 : 13 }}>{icon}</Text>
      <Text
        style={{
          fontSize: size === 'sm' ? FontSize.xs : FontSize.sm,
          fontWeight: '500',
          color: color,
        }}
      >
        {label}
      </Text>
    </View>
  );
};