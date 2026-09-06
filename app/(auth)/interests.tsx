import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { space, type } from '../../src/theme/tokens';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { categories, topTags } from '../../src/lib/library';
import { useSession } from '../../src/lib/session';

const MIN = 3;

/**
 * Interest picker. Doubles as the edit screen from the profile tab — `?mode=edit` only changes
 * the copy and where Save returns to, so there is one implementation of the rules.
 */
export default function Interests() {
  const theme = useTheme();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const editing = mode === 'edit';
  const { profile, updateProfile, busy } = useSession();

  const [picked, setPicked] = useState<string[]>(profile?.interests ?? []);
  const tags = useMemo(() => topTags(40), []);

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const pickedCategories = picked.filter((p) => categories.some((c) => c.id === p)).length;
  const enough = pickedCategories >= MIN;

  const save = async () => {
    await updateProfile({ interests: picked });
    router.replace(editing ? '/(tabs)/profile' : '/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[type.hookSm, { color: theme.text }]}>
            {editing ? 'What are you into?' : 'What should we start with?'}
          </Text>
          <Text style={[type.small, { color: theme.textMuted }]}>
            Pick at least {MIN} categories. Your feed leans this way, but never only this way —
            you will still meet ideas from outside your picks.
          </Text>
        </View>

        <Text style={[type.overline, { color: theme.textMuted }]}>CATEGORIES</Text>
        <View style={styles.grid}>
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={picked.includes(c.id)}
              onPress={() => toggle(c.id)}
              accent={c.accent}
              accentForeground={c.foreground}
            />
          ))}
        </View>

        <Text style={[type.overline, { color: theme.textMuted, marginTop: space.md }]}>
          SPECIFIC TOPICS (OPTIONAL)
        </Text>
        <View style={styles.grid}>
          {tags.map((t) => (
            <Chip key={t} label={t.replace(/-/g, ' ')} selected={picked.includes(t)} onPress={() => toggle(t)} small />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
        <Text style={[type.caption, { color: enough ? theme.positiveText : theme.textMuted }]}>
          {pickedCategories} of {MIN} categories chosen
        </Text>
        <Button
          label={editing ? 'Save interests' : 'Build my feed'}
          onPress={save}
          disabled={!enough || !profile}
          loading={busy}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.md, paddingBottom: space.xxxl },
  header: { gap: space.sm, marginBottom: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footer: { padding: space.lg, gap: space.sm, borderTopWidth: 1 },
});
