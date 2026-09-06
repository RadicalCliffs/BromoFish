import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, space, type } from '../../src/theme/tokens';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { DogearButton } from '../../src/components/DogearButton';
import { getBook, getCategory } from '../../src/lib/library';
import { useSession } from '../../src/lib/session';

type Grouping = 'recent' | 'book' | 'category';

export default function Saved() {
  const theme = useTheme();
  const router = useRouter();
  const { saved, toggleSave, profile } = useSession();
  const [grouping, setGrouping] = useState<Grouping>('recent');

  const entries = useMemo(
    () =>
      saved
        .map((s) => {
          const book = getBook(s.book_id);
          const spark = book?.sparks.find((sp) => sp.id === s.spark_id);
          return book && spark ? { saved: s, book, spark } : null;
        })
        // A save can outlive a content rebuild that dropped its book; skip it rather than crash.
        .filter((e): e is NonNullable<typeof e> => e !== null),
    [saved]
  );

  const groups = useMemo(() => {
    if (grouping === 'recent') return [{ key: 'all', label: '', items: entries }];
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const key = grouping === 'book' ? e.book.title : getCategory(e.book.category)?.label ?? e.book.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, items]) => ({ key, label: key, items }));
  }, [entries, grouping]);

  if (!profile) {
    return (
      <SafeAreaView style={[styles.empty, { backgroundColor: theme.bg }]}>
        <Text style={[type.title, { color: theme.text, textAlign: 'center' }]}>Your saves live here</Text>
        <Text style={[type.small, { color: theme.textMuted, textAlign: 'center' }]}>
          Create an account and every insight you dogear is kept, grouped and searchable.
        </Text>
        <Button label="Create an account" onPress={() => router.push('/(auth)/sign-up')} full={false} />
      </SafeAreaView>
    );
  }

  if (!entries.length) {
    return (
      <SafeAreaView style={[styles.empty, { backgroundColor: theme.bg }]}>
        <Text style={[type.title, { color: theme.text, textAlign: 'center' }]}>Nothing folded yet</Text>
        <Text style={[type.small, { color: theme.textMuted, textAlign: 'center' }]}>
          Tap the page icon on any insight in your feed and it lands here.
        </Text>
        <Button label="Go to the feed" onPress={() => router.replace('/(tabs)')} full={false} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.hookSm, { color: theme.text }]}>Saved</Text>
        <Text style={[type.small, { color: theme.textMuted }]}>
          {entries.length} {entries.length === 1 ? 'insight' : 'insights'} from{' '}
          {new Set(entries.map((e) => e.book.id)).size} books.
        </Text>

        <View style={styles.filters}>
          {(['recent', 'book', 'category'] as Grouping[]).map((g) => (
            <Chip
              key={g}
              label={g === 'recent' ? 'Most recent' : g === 'book' ? 'By book' : 'By category'}
              selected={grouping === g}
              onPress={() => setGrouping(g)}
              small
            />
          ))}
        </View>

        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            {group.label ? (
              <Text style={[type.overline, { color: theme.textMuted }]}>{group.label.toUpperCase()}</Text>
            ) : null}
            {group.items.map(({ book, spark }) => {
              const accent = getCategory(book.category)?.accent ?? theme.accent;
              return (
                <View
                  key={spark.id}
                  style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.cardHead}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
                      accessibilityRole="link"
                      accessibilityLabel={`From ${book.title}. Opens the book.`}
                    >
                      <Text style={[type.caption, { color: theme.textMuted }]} numberOfLines={1}>
                        {book.title.toUpperCase()}
                      </Text>
                    </Pressable>
                    <DogearButton
                      saved
                      size={22}
                      onToggle={() => toggleSave({ spark_id: spark.id, book_id: book.id })}
                    />
                  </View>
                  <Text style={[type.bodyStrong, { color: theme.text }]}>{spark.hook}</Text>
                  <Text style={[type.small, { color: theme.textMuted }]}>{spark.apply}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  filters: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  group: { gap: space.sm, marginTop: space.sm },
  card: { borderWidth: 1.5, borderRadius: radius.md, padding: space.lg, gap: space.xs },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
