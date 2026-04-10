import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';

interface LineChartPoint {
  label: string;
  value: number;
}

interface Props {
  data: LineChartPoint[];
  height?: number;
  color?: string;
  showZeroLine?: boolean;
}

export const LineChart: React.FC<Props> = ({
  data,
  height = 160,
  color,
  showZeroLine = false,
}) => {
  const { colors } = useTheme();

  if (!data || data.length === 0) return null;

  const width = Math.max(240, data.length * 48);
  const chartHeight = Math.max(60, height - 28);
  const maxValue = Math.max(...data.map((point) => point.value), 0);
  const minValue = Math.min(...data.map((point) => point.value), 0);
  const range = Math.max(maxValue - minValue, 1);
  const stroke = color ?? colors.primary;

  const getX = (index: number) =>
    data.length === 1 ? width / 2 : (index / (data.length - 1)) * (width - 24) + 12;
  const getY = (value: number) =>
    10 + ((maxValue - value) / range) * Math.max(chartHeight - 20, 1);

  const path = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.value)}`)
    .join(' ');

  const zeroLineY = getY(0);
  const showBaseline = showZeroLine && minValue < 0 && maxValue > 0;

  return (
    <View style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={12}
          y1={chartHeight}
          x2={width - 12}
          y2={chartHeight}
          stroke={colors.border}
          strokeWidth={0.75}
        />

        {showBaseline && (
          <Line
            x1={12}
            y1={zeroLineY}
            x2={width - 12}
            y2={zeroLineY}
            stroke={colors.textTertiary}
            strokeDasharray="4 4"
            strokeWidth={0.75}
            opacity={0.5}
          />
        )}

        <Path d={path} fill="none" stroke={stroke} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((point, index) => (
          <React.Fragment key={`${point.label}-${index}`}>
            <Circle cx={getX(index)} cy={getY(point.value)} r={3.5} fill={stroke} />
            <SvgText
              x={getX(index)}
              y={height - 6}
              textAnchor="middle"
              fontSize={10}
              fill={colors.textTertiary}
            >
              {point.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};
