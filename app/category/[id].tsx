import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { space, type } from '../../src/theme/tokens';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { BookRow } from '../../src/components/BookRow';
import { books, getCategory } from '../../src/lib/library';
import type { Difficulty } from '../../src/lib/types';

const SORTS = ['A–Z', 'Newest', 'Oldest'] as const;
type Sort = (typeof SORTS)[number];

export default function CategoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = getCategory(String(id));
  const [sort, setSort] = useState<Sort>('A–Z');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const list = useMemo(() => {
    let out = books.filter((b) => b.category === String(id));
    if (difficulty) out = out.filter((b) => b.difficulty === difficulty);
    return out.sort((a, b) =>
      sort === 'A–Z' ? a.title.localeCompare(b.title) : sort === 'Newest' ? b.year - a.year : a.year - b.year
    );
  }, [id, sort, difficulty]);

  if (!category) {
    return (
      <SafeAreaView style={[styles.empty, { backgroundColor: theme.bg }]}>
        <Text style={[type.title, { color: theme.text }]}>Unknown category.</Text>
        <Button label="Go back" onPress={() => router.back()} full={false} />
      </SafeAreaView>
    );
  }

  const wash = theme.name === 'dark' ? category.tintDark : category.tint;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <LinearGradient colors={[wash, theme.bg]} locations={[0, 0.5]} style={styles.wash} pointerEvents="none" />
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.hookSm, { color: theme.text }]} accessibilityRole="header">
          {category.label}
        </Text>
        <Text style={[type.body, { color: theme.textMuted }]}>{category.blurb}</Text>
        <Text style={[type.caption, { color: theme.textMuted }]}>
          {list.length} {list.length === 1 ? 'BOOK' : 'BOOKS'}
        </Text>

        <View style={styles.filters}>
          {SORTS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={sort === s}
              onPress={() => setSort(s)}
              accent={category.accent}
              accentForeground={category.foreground}
              small
            />
          ))}
        </View>
        <View style={styles.filters}>
          {(['easy', 'moderate', 'challenging'] as Difficulty[]).map((d) => (
            <Chip
              key={d}
              label={d}
              selected={difficulty === d}
              onPress={() => setDifficulty(difficulty === d ? null : d)}
              accent={category.accent}
              accentForeground={category.foreground}
              small
            />
          ))}
        </View>

        {list.length === 0 ? (
          <Text style={[type.small, { color: theme.textMuted }]}>
            No books match that filter yet.
          </Text>
        ) : (
          list.map((b) => <BookRow key={b.id} book={b} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  bar: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xxxl },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
});
