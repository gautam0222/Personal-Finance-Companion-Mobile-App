import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
  style?: object;
}

export const SectionHeader: React.FC<Props> = ({
  title,
  actionLabel,
  onAction,
  subtitle,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: subtitle ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing[3],
        },
        style,
      ]}
    >
      <View>
        <Text
          style={{
            fontSize: FontSize.lg,
            fontWeight: '600',
            color: colors.text,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: FontSize.xs,
              color: colors.textTertiary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text
            style={{
              fontSize: FontSize.sm,
              color: colors.primary,
              fontWeight: '500',
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};