import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, space, type } from '../../src/theme/tokens';
import { BookRow } from '../../src/components/BookRow';
import { books, categories, search } from '../../src/lib/library';
import type { Book } from '../../src/lib/types';

/** Curated rails, so the library has an obvious way in that is not the search box. */
function useCollections(): { title: string; blurb: string; books: Book[] }[] {
  return useMemo(() => {
    const pick = (fn: (b: Book) => boolean, n = 12) => books.filter(fn).slice(0, n);
    return [
      {
        title: 'Start here',
        blurb: 'The ones that change how you see everything after them.',
        books: pick((b) => b.difficulty === 'easy' && b.year < 2015, 12),
      },
      {
        title: 'Quick wins',
        blurb: 'Short, practical, usable before the end of the week.',
        books: pick((b) => (b.read_time_min ?? 12) <= 9, 12),
      },
      {
        title: 'Worth the effort',
        blurb: 'Denser books. You will get more out of them than you expect.',
        books: pick((b) => b.difficulty === 'challenging', 12),
      },
      {
        title: 'Recently written',
        blurb: 'Modern work that has already held up.',
        books: [...books].filter((b) => b.year >= 2018).sort((a, b) => b.year - a.year).slice(0, 12),
      },
    ].filter((c) => c.books.length > 0);
  }, []);
}

export default function Discover() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const results = useMemo(() => search(query), [query]);
  const collections = useCollections();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[type.hookSm, { color: theme.text }]}>Discover</Text>

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.borderStrong }]}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search books, authors, ideas"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="Search the library"
            autoCorrect={false}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {query.trim().length >= 2 ? (
          <View style={styles.section}>
            <Text style={[type.caption, { color: theme.textMuted }]}>
              {results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'}
            </Text>
            {results.length === 0 ? (
              <Text style={[type.small, { color: theme.textMuted }]}>
                Nothing matched. Try an author, or a broader word like “habits” or “power”.
              </Text>
            ) : (
              results.map((b) => <BookRow key={b.id} book={b} />)
            )}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[type.overline, { color: theme.textMuted }]}>BROWSE BY CATEGORY</Text>
              <View style={styles.grid}>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => router.push({ pathname: '/category/[id]', params: { id: c.id } })}
                    accessibilityRole="link"
                    accessibilityLabel={`${c.label}. ${c.blurb}`}
                    style={({ pressed }) => [styles.tile, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Text style={[type.bodyStrong, { color: c.foreground }]} numberOfLines={2}>
                      {c.label}
                    </Text>
                    <Text style={[type.caption, { color: c.foreground, opacity: 0.85 }]} numberOfLines={2}>
                      {c.blurb}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {collections.map((col) => (
              <View key={col.title} style={styles.section}>
                <Text style={[type.title, { color: theme.text }]}>{col.title}</Text>
                <Text style={[type.small, { color: theme.textMuted }]}>{col.blurb}</Text>
                {col.books.map((b) => (
                  <BookRow key={b.id} book={b} />
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxxl },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    minHeight: 50,
  },
  searchInput: { flex: 1, ...type.body, paddingVertical: space.md },
  section: { gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: { flexGrow: 1, flexBasis: '46%', minHeight: 92, borderRadius: radius.md, padding: space.md, gap: 4, justifyContent: 'center' },
});
