import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { HomeScreen }         from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { GoalsScreen }        from '../screens/GoalsScreen';
import { InsightsScreen }     from '../screens/InsightsScreen';
import { SettingsScreen }     from '../screens/SettingsScreen';

import { useTheme }        from '../hooks/useTheme';
import { FontSize }        from '../constants/typography';
import { Spacing, Radius } from '../constants/spacing';
import type { TabParamList } from '../types';

const Tab   = createBottomTabNavigator<TabParamList>();
const { width: SW } = Dimensions.get('window');

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabDef {
  name:   keyof TabParamList;
  label:  string;
  icon:   IoniconName;
  active: IoniconName;
}

const TABS: TabDef[] = [
  { name: 'Home',         label: 'Home',     icon: 'home-outline',      active: 'home'      },
  { name: 'Transactions', label: 'Wallet',   icon: 'card-outline',      active: 'card'      },
  { name: 'Goals',        label: 'Goals',    icon: 'flag-outline',      active: 'flag'      },
  { name: 'Insights',     label: 'Insights', icon: 'bar-chart-outline', active: 'bar-chart' },
  { name: 'Settings',     label: 'You',      icon: 'person-outline',    active: 'person'    },
];

interface TabBarProps {
  state: any;
  navigation: any;
}

function CustomTabBar({ state, navigation }: TabBarProps) {
  const { colors, isDark } = useTheme();
  const insets             = useSafeAreaInsets();

  // Animated sliding indicator
  const tabWidth     = SW / TABS.length;
  const indicatorAnim = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue:          state.index * tabWidth,
      useNativeDriver:  true,
      tension:          68,
      friction:         11,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[
      styles.bar,
      {
        backgroundColor: isDark ? '#08090F' : '#FFFFFF',
        borderTopColor:  colors.border,
        paddingBottom:   Math.max(insets.bottom, 8) + 4,
      },
    ]}>
      {/* Sliding active indicator */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            width:           tabWidth,
            backgroundColor: colors.primaryMuted,
            transform:       [{ translateX: indicatorAnim }],
          },
        ]}
      />

      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const tab     = TABS[index];

        const onPress = async () => {
          const event = navigation.emit({
            type: 'tabPress', target: route.key, canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={styles.item}
          >
            <Ionicons
              name={focused ? tab.active : tab.icon}
              size={22}
              color={focused ? colors.primary : colors.textTertiary}
            />
            <Text style={[
              styles.label,
              { color: focused ? colors.primary : colors.textTertiary },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home"         component={HomeScreen} />
    <Tab.Screen name="Transactions" component={TransactionsScreen} />
    <Tab.Screen name="Goals"        component={GoalsScreen} />
    <Tab.Screen name="Insights"     component={InsightsScreen} />
    <Tab.Screen name="Settings"     component={SettingsScreen} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: Spacing[2.5],
    position: 'relative',
  },
  indicator: {
    position:     'absolute',
    top:          0,
    height:       2,
    borderRadius: 1,
  },
  item: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            3,
    paddingTop:     Spacing[2],
  },
  label: {
    fontSize:   FontSize.xs,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});