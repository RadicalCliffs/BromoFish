import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { type } from '../theme/tokens';

/** Daily goal ring. The numeric label is always rendered — the arc alone is not an accessible signal. */
export function ProgressRing({
  value,
  goal,
  size = 64,
  label,
}: {
  value: number;
  goal: number;
  size?: number;
  label?: string;
}) {
  const theme = useTheme();
  const stroke = size * 0.11;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const complete = pct >= 1;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? `${value} of ${goal} sparks read today`}
      accessibilityValue={{ min: 0, max: goal, now: value }}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={complete ? theme.positive : theme.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[type.caption, { color: theme.text, fontSize: size * 0.26 }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
