import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  View, ViewStyle, TextStyle,
} from 'react-native';
import * as Haptics from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size    = 'sm' | 'md' | 'lg';

interface Props {
  label:      string;
  onPress:    () => void;
  variant?:   Variant;
  size?:      Size;
  loading?:   boolean;
  disabled?:  boolean;
  icon?:      React.ReactNode;
  iconRight?: React.ReactNode;
  style?:     ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  haptic?:    boolean;
}

export const Button: React.FC<Props> = ({
  label, onPress,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon, iconRight, style, textStyle,
  fullWidth = true,
  haptic    = true,
}) => {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = async () => {
    if (isDisabled) return;
    if (haptic) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const heights:   Record<Size, number> = { sm: 40, md: 52, lg: 56 };
  const fontSizes: Record<Size, number> = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.md };
  const paddingH:  Record<Size, number> = { sm: Spacing[4], md: Spacing[6], lg: Spacing[8] };

  const baseStyle: ViewStyle = {
    height:          heights[size],
    borderRadius:    Radius.full,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: paddingH[size],
    gap:             Spacing[2],
    alignSelf:       fullWidth ? 'stretch' : 'center',
    opacity:         isDisabled ? 0.45 : 1,
  };

  const textColor: Record<Variant, string> = {
    primary:   '#FFFFFF',
    secondary: colors.primaryLight,
    ghost:     colors.text,
    danger:    colors.expenseText,
    success:   colors.incomeText,
  };

  const content = (
    <>
      {loading
        ? <ActivityIndicator size="small" color={textColor[variant]} />
        : <>
            {icon}
            <Text style={[{
              fontSize:      fontSizes[size],
              fontWeight:    '600',
              color:         textColor[variant],
              letterSpacing: variant === 'primary' ? 0.2 : 0,
            }, textStyle]}>
              {label}
            </Text>
            {iconRight}
          </>
      }
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.84}
        style={[{ alignSelf: fullWidth ? 'stretch' : 'center', opacity: isDisabled ? 0.45 : 1 }, style]}
      >
        <LinearGradient
          colors={['#6366F1', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[baseStyle, { opacity: 1 }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const bgColors: Record<Variant, string> = {
    primary:   'transparent',
    secondary: colors.primaryMuted,
    ghost:     'transparent',
    danger:    colors.expenseMuted,
    success:   colors.incomeMuted,
  };
  const borderColors: Record<Variant, string> = {
    primary:   'transparent',
    secondary: colors.primaryMutedBorder,
    ghost:     colors.border,
    danger:    `${colors.expense}44`,
    success:   `${colors.income}44`,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={[
        baseStyle,
        {
          backgroundColor: bgColors[variant],
          borderWidth:     1,
          borderColor:     borderColors[variant],
        },
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
};
