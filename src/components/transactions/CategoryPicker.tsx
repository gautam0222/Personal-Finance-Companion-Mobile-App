import React from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { getCategoriesForType } from '../../constants/categories';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

interface Props {
  type:     'income' | 'expense';
  selected: string;
  onSelect: (id: string) => void;
}

export const CategoryPicker: React.FC<Props> = ({ type, selected, onSelect }) => {
  const { colors } = useTheme();
  const categories = getCategoriesForType(type);

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing[2], paddingRight: Spacing[4] }}
      >
        {categories.map((cat) => {
          const active = selected === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={async () => { await Haptics.selectionAsync(); onSelect(cat.id); }}
              activeOpacity={0.75}
              style={[
                styles.tile,
                {
                  backgroundColor: active ? `${cat.color}18` : colors.cardElevated,
                  borderColor:     active ? `${cat.color}55`  : colors.border,
                  borderWidth:     active ? 1.5 : 1,
                },
              ]}
            >
              <View style={[styles.tileIconBox, { backgroundColor: `${cat.color}${active ? '25' : '15'}` }]}>
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={cat.color}
                />
              </View>
              <Text
                style={[
                  styles.tileLabel,
                  { color: active ? cat.color : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {cat.label.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize:      FontSize.sm,
    fontWeight:    '500',
    marginBottom:  Spacing[2],
    letterSpacing: 0.3,
  },
  tile: {
    width:          76,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius:   Radius.lg,
    alignItems:     'center',
    gap:            Spacing[2],
  },
  tileIconBox: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize:   FontSize.xs,
    fontWeight: '500',
    textAlign:  'center',
  },
});