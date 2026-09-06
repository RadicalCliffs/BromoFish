import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';
import { getCategory } from '../lib/library';
import type { Book } from '../lib/types';

/** Compact book row used by search, category listings and the saved tab. */
export function BookRow({ book }: { book: Book }) {
  const theme = useTheme();
  const router = useRouter();
  const category = getCategory(book.category);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}
      accessibilityRole="link"
      accessibilityLabel={`${book.title} by ${book.author}. ${book.sparks.length} insights. ${book.crux.headline}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.spine, { backgroundColor: category?.accent ?? theme.accent }]} />
      <View style={styles.body}>
        <Text style={[type.bodyStrong, { color: theme.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[type.small, { color: theme.textMuted }]} numberOfLines={1}>
          {book.author} · {book.year}
        </Text>
        <Text style={[type.small, { color: theme.text, marginTop: 2 }]} numberOfLines={2}>
          {book.crux.headline}
        </Text>
        <Text style={[type.caption, { color: theme.textMuted, marginTop: 4 }]}>
          {book.sparks.length} insights · {book.difficulty}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1.5, borderRadius: radius.md, overflow: 'hidden' },
  spine: { width: 6 },
  body: { flex: 1, padding: space.lg, gap: 2 },
});
