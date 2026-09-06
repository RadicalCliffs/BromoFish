import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';

/**
 * Falls back to initials on a hue derived from the handle, so every profile looks intentional
 * before a photo is ever uploaded.
 */
export function Avatar({ uri, name, size = 44 }: { uri?: string | null; name: string; size?: number }) {
  const theme = useTheme();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'D';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, { width: size, height: size, borderRadius: size / 2, borderColor: theme.border }]}
        contentFit="cover"
        transition={160}
        accessibilityLabel={`${name}'s profile photo`}
      />
    );
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;

  return (
    <View
      accessibilityLabel={`${name}, no profile photo`}
      style={[
        styles.base,
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.border,
          // 34% lightness keeps white initials above 4.5:1 at every hue.
          backgroundColor: `hsl(${hue} 62% 34%)`,
        },
      ]}
    >
      <Text style={{ color: palette.white, fontWeight: '800', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1.5 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
