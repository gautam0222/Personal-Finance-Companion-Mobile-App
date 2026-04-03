import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { DonutDataPoint } from '../../types';
import { FontSize } from '../../constants/typography';

interface Props {
  data: DonutDataPoint[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
}

export const DonutChart: React.FC<Props> = ({
  data,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  centerSublabel,
}) => {
  const { colors } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  // Build segments
  let cumulative = 0;
  const segments = data.map((item) => {
    const ratio = item.value / total;
    const dash = ratio * circumference;
    const gap = circumference - dash;
    const offset = circumference - cumulative * circumference;
    cumulative += ratio;
    return { ...item, dash, gap, offset };
  });

  // Rotate so first segment starts at top
  const rotateOffset = -90;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        <G rotation={rotateOffset} origin={`${cx},${cy}`}>
          {segments.map((seg, i) => (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset + circumference}
              strokeLinecap="round"
            />
          ))}
        </G>

        {/* Center text */}
        {centerLabel && (
          <SvgText
            x={cx}
            y={cy - (centerSublabel ? 8 : 0)}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={18}
            fontWeight="700"
            fill={colors.text}
          >
            {centerLabel}
          </SvgText>
        )}
        {centerSublabel && (
          <SvgText
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={10}
            fill={colors.textTertiary}
          >
            {centerSublabel}
          </SvgText>
        )}
      </Svg>
    </View>
  );
};