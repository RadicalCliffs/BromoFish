import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';
import { useSession } from '../lib/session';

/**
 * Tells the user plainly where their account lives.
 *
 * With no Supabase project configured the app still works end to end, but there is no server
 * and therefore no real password check — pretending otherwise would be the dishonest option.
 */
export function BackendNotice() {
  const theme = useTheme();
  const { backendKind } = useSession();
  if (backendKind === 'supabase') return null;

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name="phone-portrait-outline" size={18} color={theme.textMuted} />
      <Text style={[type.caption, { color: theme.textMuted, flex: 1, fontWeight: '400' }]}>
        No server is connected, so your account and saves stay on this device and are not
        password-protected. Add a Supabase project to sync across devices.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: space.md,
  },
});
