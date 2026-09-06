import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, space, type } from '../../src/theme/tokens';
import { Button } from '../../src/components/Button';
import { ShiftMark, Wordmark } from '../../src/components/Logo';
import { categories, libraryCounts } from '../../src/lib/library';

const fmt = (n: number) => n.toLocaleString('en-GB');

export default function Welcome() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ShiftMark size={64} />
          <Wordmark size={40} showMark={false} />
          <Text style={[type.title, styles.tagline, { color: theme.accent }]}>UNLEARN. REWIRE. EXECUTE.</Text>
          <Text style={[type.body, styles.blurb, { color: theme.textMuted }]}>
            Replace doomscrolling with real insights. Feed-based microlearning that changes how you think, curated by your interests.
          </Text>
        </View>

        <View style={[styles.stats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Stat value={fmt(libraryCounts.books)} label="books" />
          <Divider />
          <Stat value={fmt(libraryCounts.sparks)} label="insights" />
          <Divider />
          <Stat value={String(categories.length)} label="categories" />
        </View>

        <View style={styles.actions}>
          <Button label="Create your account" onPress={() => router.push('/(auth)/sign-up')} />
          <Button label="I already have one" variant="secondary" onPress={() => router.push('/(auth)/sign-in')} />
          <Button label="Look around first" variant="ghost" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={[type.title, { color: theme.text }]}>{value}</Text>
      <Text style={[type.caption, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: theme.border }} />;
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.xxl, flexGrow: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: space.md },
  tagline: { textAlign: 'center', marginTop: space.sm },
  blurb: { textAlign: 'center', maxWidth: 460 },
  stats: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  actions: { gap: space.md, alignSelf: 'center', width: '100%', maxWidth: 460 },
});
