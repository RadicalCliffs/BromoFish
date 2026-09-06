import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../src/lib/session';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * Entry gate. Three states, in order: still restoring, signed out, and signed in but with no
 * interests picked yet — that last one is what makes a brand new feed feel curated.
 */
export default function Index() {
  const { profile, ready } = useSession();
  const theme = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }
  if (!profile) return <Redirect href="/(auth)/welcome" />;
  if (!profile.interests?.length) return <Redirect href="/(auth)/interests" />;
  return <Redirect href="/(tabs)" />;
}
