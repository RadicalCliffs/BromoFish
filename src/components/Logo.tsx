import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { palette, type } from '../theme/tokens';

/**
 * The mark is a lightning bolt — fast, aggressive, cutting through the noise.
 * It is drawn rather than shipped as an asset so it inherits the theme and stays crisp at every size.
 */
export function ShiftMark({ size = 28, color, glowColor }: { size?: number; color?: string; glowColor?: string }) {
  const theme = useTheme();
  const bolt = color ?? theme.accent;
  const glow = glowColor ?? 'rgba(0, 217, 255, 0.3)';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image" accessibilityLabel="Shift for Brains">
      {/* Lightning bolt shape */}
      <Path d="M13 1L2 11h7l2 12 9-10h-7l-2-12Z" fill={bolt} />
      {/* Glow effect */}
      <Path d="M13 1L2 11h7l2 12 9-10h-7l-2-12Z" fill={glow} opacity={0.6} />
    </Svg>
  );
}

export function DogearMark(props: any) {
  return <ShiftMark {...props} />;
}

export function Wordmark({
  size = 22,
  color,
  showMark = true,
}: {
  size?: number;
  color?: string;
  /** Off when the caller is already showing the mark at a larger size above it. */
  showMark?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {showMark && <ShiftMark size={size * 1.25} />}
      <Text
        style={[
          styles.word,
          { color: color ?? theme.accent, fontSize: size, lineHeight: size * 1.15, letterSpacing: size * 0.05, fontWeight: '800' },
        ]}
      >
        SHIFT
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontWeight: type.hook.fontWeight },
});
