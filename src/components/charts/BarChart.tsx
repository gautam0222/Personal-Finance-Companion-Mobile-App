import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { BarDataPoint } from '../../types';
import { FontSize } from '../../constants/typography';

interface Props {
  data: BarDataPoint[];
  height?: number;
  activeColor?: string;
  showValues?: boolean;
  highlightLast?: boolean;
  currencySymbol?: string;
}

export const BarChart: React.FC<Props> = ({
  data,
  height = 160,
  activeColor,
  showValues = false,
  highlightLast = true,
  currencySymbol = '₹',
}) => {
  const { colors, isDark } = useTheme();
  const primary = activeColor ?? colors.primary;

  if (!data || data.length === 0) return null;

  const chartHeight = height - 32; // Reserve space for labels
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barGap = 6;

  return (
    <View style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${data.length * 40} ${height}`}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={primary} stopOpacity={isDark ? 0.9 : 0.85} />
            <Stop offset="100%" stopColor={primary} stopOpacity={isDark ? 0.4 : 0.35} />
          </LinearGradient>
          <LinearGradient id="barGradDim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.textTertiary} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={colors.textTertiary} stopOpacity={0.15} />
          </LinearGradient>
        </Defs>

        {/* Baseline */}
        <Line
          x1={0}
          y1={chartHeight}
          x2={data.length * 40}
          y2={chartHeight}
          stroke={colors.border}
          strokeWidth={0.75}
        />

        {data.map((item, i) => {
          const barW = 26;
          const x = i * 40 + 7;
          const isLast = highlightLast && i === data.length - 1;
          const isHighest = item.value === maxVal && maxVal > 0;
          const barH = maxVal === 0 ? 2 : Math.max(2, (item.value / maxVal) * (chartHeight - 12));
          const barY = chartHeight - barH;
          const fill = item.value > 0 ? 'url(#barGrad)' : 'url(#barGradDim)';

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={barY}
                width={barW}
                height={barH}
                rx={6}
                ry={6}
                fill={fill}
              />
              {/* Label */}
              <SvgText
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={10}
                fill={isLast ? primary : colors.textTertiary}
                fontWeight={isLast ? '600' : '400'}
              >
                {item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};