import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';
import { Spacing, Radius } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

interface Props {
  icon:          keyof typeof Ionicons.glyphMap;
  title:         string;
  description?:  string;
  actionLabel?:  string;
  onAction?:     () => void;
  compact?:      boolean;
}

export const EmptyState: React.FC<Props> = ({
  icon, title, description, actionLabel, onAction, compact = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <Ionicons name={icon} size={compact ? 22 : 28} color={colors.primaryLight} />
      </View>

      <Text style={[styles.title, { color: colors.text, fontSize: compact ? FontSize.md : FontSize.xl }]}>
        {title}
      </Text>

      {description && (
        <Text style={[styles.desc, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          fullWidth={false}
          style={{ marginTop: Spacing[2] }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[16],
    paddingHorizontal: Spacing[8],
    gap: Spacing[3],
  },
  compact: {
    flex: 0,
    paddingVertical: Spacing[8],
  },
  iconWrap: {
    width: 56, height: 56,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.6,
  },
});