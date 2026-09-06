import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { palette, type } from '../theme/tokens';

/**
 * The mark is a page with its top-right corner folded down — the gesture the app is named
 * after. It is drawn rather than shipped as an asset so it inherits the theme and stays crisp
 * at every size.
 */
export function DogearMark({ size = 28, color, foldColor }: { size?: number; color?: string; foldColor?: string }) {
  const theme = useTheme();
  const page = color ?? theme.text;
  const fold = foldColor ?? palette.marigold;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image" accessibilityLabel="Dogear">
      {/* Page body, with the corner cut away. */}
      <Path d="M4 2.8h9.4L20 9.4V21a1.2 1.2 0 0 1-1.2 1.2H4A1.2 1.2 0 0 1 2.8 21V4A1.2 1.2 0 0 1 4 2.8Z" fill={page} />
      {/* The folded corner itself, sitting proud of the page. */}
      <Path d="M13.4 2.8 20 9.4h-5.4a1.2 1.2 0 0 1-1.2-1.2V2.8Z" fill={fold} />
      <Path d="M13.4 2.8 20 9.4h-5.4a1.2 1.2 0 0 1-1.2-1.2V2.8Z" fill={palette.black} opacity={0.14} />
      {/* Three lines of text on the page. */}
      <Path
        d="M6.4 12.6h9.6M6.4 15.6h9.6M6.4 18.6h6"
        stroke={theme.bg}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.85}
      />
    </Svg>
  );
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
      {showMark && <DogearMark size={size * 1.25} />}
      <Text
        style={[
          styles.word,
          { color: color ?? theme.text, fontSize: size, lineHeight: size * 1.15, letterSpacing: -size * 0.03 },
        ]}
      >
        Dogear
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontWeight: type.hook.fontWeight },
});
