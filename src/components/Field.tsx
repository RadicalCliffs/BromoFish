import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';

interface Props extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  /** Shown under the field as "12 / 160" when a maxLength is set. */
  showCount?: boolean;
}

export function Field({ label, hint, error, showCount, style, value, maxLength, ...rest }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[type.caption, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
      <TextInput
        {...rest}
        value={value}
        maxLength={maxLength}
        placeholderTextColor={theme.textMuted}
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.savedText : theme.borderStrong,
            color: theme.text,
          },
          style,
        ]}
      />
      <View style={styles.footer}>
        <Text style={[type.caption, { color: error ? theme.savedText : theme.textMuted, flex: 1 }]}>
          {error ?? hint ?? ''}
        </Text>
        {showCount && maxLength ? (
          <Text style={[type.caption, { color: theme.textMuted }]}>
            {(value ?? '').length} / {maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    ...type.body,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 18 },
});
