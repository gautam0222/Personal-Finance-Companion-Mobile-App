import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing, Shadow } from '../../constants/spacing';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'bordered' | 'transparent';
  padding?: number | 'none';
  radius?: number;
}

export const Card: React.FC<Props> = ({
  children,
  style,
  variant = 'default',
  padding,
  radius = Radius['2xl'],
}) => {
  const { colors, isDark } = useTheme();

  const padValue = padding === 'none' ? 0 : padding ?? Spacing[5];

  const bgColor: Record<string, string> = {
    default: colors.card,
    elevated: colors.cardElevated,
    bordered: colors.card,
    transparent: 'transparent',
  };

  const borderStyle =
    variant === 'bordered'
      ? { borderWidth: 1, borderColor: colors.border }
      : {};

  const shadowStyle = isDark ? {} : variant === 'elevated' ? Shadow.sm : {};

  return (
    <View
      style={[
        {
          backgroundColor: bgColor[variant],
          borderRadius: radius,
          padding: padValue,
          ...borderStyle,
          ...shadowStyle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};