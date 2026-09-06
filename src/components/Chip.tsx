import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Category accent. When selected, the chip fills with it. */
  accent?: string;
  accentForeground?: string;
  small?: boolean;
}

export function Chip({ label, selected, onPress, accent, accentForeground, small }: Props) {
  const theme = useTheme();
  const fill = accent ?? theme.accent;
  const fg = accentForeground ?? theme.onAccent;

  return (
    <Pressable
      onPress={() => {
        if (!onPress) return;
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={!onPress}
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        small && styles.small,
        {
          backgroundColor: selected ? fill : theme.surface,
          // Selected chips carry a check glyph as well as the fill, so the state never depends
          // on colour alone.
          borderColor: selected ? fill : theme.borderStrong,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[small ? styles.labelSmall : styles.label, { color: selected ? fg : theme.text }]}
      >
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  small: { minHeight: 32, paddingHorizontal: space.md, paddingVertical: space.xs },
  label: { ...type.small, fontWeight: '600' },
  labelSmall: { ...type.caption },
});
