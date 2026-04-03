import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<TextInput, Props>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      prefix,
      suffix,
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);

    const borderColor = error
      ? colors.expense
      : focused
      ? colors.primary
      : colors.border;

    return (
      <View style={containerStyle}>
        {label && (
          <Text
            style={{
              fontSize: FontSize.sm,
              fontWeight: '500',
              color: colors.textSecondary,
              marginBottom: Spacing[1.5],
              letterSpacing: 0.3,
            }}
          >
            {label}
          </Text>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.cardElevated,
            borderRadius: Radius.lg,
            borderWidth: focused ? 1.5 : 1,
            borderColor,
            paddingHorizontal: Spacing[4],
            height: 52,
          }}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={18}
              color={focused ? colors.primary : colors.textTertiary}
              style={{ marginRight: Spacing[2] }}
            />
          )}

          {prefix && (
            <Text
              style={{
                fontSize: FontSize['2xl'],
                fontWeight: '700',
                color: focused ? colors.text : colors.textSecondary,
                marginRight: Spacing[1.5],
              }}
            >
              {prefix}
            </Text>
          )}

          <TextInput
            ref={ref}
            style={[
              {
                flex: 1,
                fontSize: prefix ? FontSize['2xl'] : FontSize.md,
                fontWeight: prefix ? '700' : '400',
                color: colors.text,
                padding: 0,
                letterSpacing: prefix ? -0.5 : 0,
              },
              style,
            ]}
            placeholderTextColor={colors.textTertiary}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />

          {suffix && (
            <Text style={{ fontSize: FontSize.sm, color: colors.textTertiary, marginLeft: Spacing[1] }}>
              {suffix}
            </Text>
          )}

          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.7}>
              <Ionicons
                name={rightIcon}
                size={18}
                color={colors.textTertiary}
                style={{ marginLeft: Spacing[2] }}
              />
            </TouchableOpacity>
          )}
        </View>

        {(error || hint) && (
          <Text
            style={{
              fontSize: FontSize.xs,
              color: error ? colors.expense : colors.textTertiary,
              marginTop: Spacing[1],
              marginLeft: Spacing[1],
            }}
          >
            {error ?? hint}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';