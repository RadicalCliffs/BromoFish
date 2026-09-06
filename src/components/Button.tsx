import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { HIT_SIZE, radius, space, type } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  full?: boolean;
  style?: ViewStyle;
  /** Overrides the announced label when the visible one is not descriptive on its own. */
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  full = true,
  style,
  accessibilityLabel,
}: Props) {
  const theme = useTheme();
  const inactive = disabled || loading;

  const skin: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.accent, fg: theme.onAccent, border: 'transparent' },
    secondary: { bg: 'transparent', fg: theme.text, border: theme.borderStrong },
    ghost: { bg: 'transparent', fg: theme.textMuted, border: 'transparent' },
    danger: { bg: 'transparent', fg: theme.savedText, border: theme.savedText },
  };
  const s = skin[variant];

  return (
    <Pressable
      onPress={() => {
        if (inactive) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: s.bg,
          borderColor: s.border,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: inactive ? 0.45 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed && !inactive ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={s.fg} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={[styles.label, { color: s.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HIT_SIZE + 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { ...type.bodyStrong },
});
