import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number;   // 0–100
  size: number;
  strokeWidth?: number;
  colors?: [string, string];
  trackColor?: string;
  children?: React.ReactNode;
  animated?: boolean;
}

export const RingProgress: React.FC<Props> = ({
  progress,
  size,
  strokeWidth = 12,
  colors: ringColors,
  trackColor,
  children,
  animated = true,
}) => {
  const { colors, isDark } = useTheme();
  const animVal = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      Animated.timing(animVal, {
        toValue: clampedProgress,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    } else {
      animVal.setValue(clampedProgress);
    }
  }, [clampedProgress]);

  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const gradStart = ringColors?.[0] ?? '#7C3AED';
  const gradEnd   = ringColors?.[1] ?? '#EC4899';
  const track     = trackColor ?? (isDark ? colors.border : colors.borderLight);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute' }}
      >
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={gradStart} />
            <Stop offset="100%" stopColor={gradEnd} />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />

        {/* Progress */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={cx}
          originY={cy}
        />
      </Svg>

      {/* Center content */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
};