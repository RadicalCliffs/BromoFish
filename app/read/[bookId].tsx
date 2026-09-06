import React, { useMemo, useState } from 'react';
import { FlatList, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { space, type } from '../../src/theme/tokens';
import { SparkCard } from '../../src/components/SparkCard';
import { Button } from '../../src/components/Button';
import { bookFeed, getBook } from '../../src/lib/library';
import { useSession } from '../../src/lib/session';

/** One book, read straight through — the same card as the feed, in the author's order. */
export default function ReadBook() {
  const theme = useTheme();
  const router = useRouter();
  const { bookId, start } = useLocalSearchParams<{ bookId: string; start?: string }>();
  const { savedIds, toggleSave, profile, recordView } = useSession();
  const [cardHeight, setCardHeight] = useState(0);

  const book = getBook(String(bookId));
  const items = useMemo(() => (book ? bookFeed(book) : []), [book]);
  const initialIndex = Math.min(Math.max(Number(start ?? 0) || 0, 0), Math.max(items.length - 1, 0));

  if (!book) {
    return (
      <SafeAreaView style={[styles.empty, { backgroundColor: theme.bg }]}>
        <Text style={[type.title, { color: theme.text }]}>That book is not in the library.</Text>
        <Button label="Go back" onPress={() => router.back()} full={false} />
      </SafeAreaView>
    );
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== cardHeight) setCardHeight(h);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
          <Ionicons name="chevron-down" size={26} color={theme.text} />
        </Pressable>
        <Text style={[type.caption, { color: theme.textMuted, flex: 1 }]} numberOfLines={1}>
          {book.title.toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1 }} onLayout={onLayout}>
        {cardHeight > 0 && (
          <FlatList
            data={items}
            keyExtractor={(i) => i.spark.id}
            renderItem={({ item }) => (
              <SparkCard
                item={item}
                height={cardHeight}
                saved={savedIds.has(item.spark.id)}
                onToggleSave={() => {
                  if (!profile) {
                    router.push('/(auth)/sign-up');
                    return;
                  }
                  toggleSave({ spark_id: item.spark.id, book_id: item.bookId });
                }}
              />
            )}
            pagingEnabled
            snapToInterval={cardHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: cardHeight, offset: cardHeight * index, index })}
            initialScrollIndex={initialIndex}
            viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
            onViewableItemsChanged={({ viewableItems }) => {
              const id = viewableItems[0]?.item?.spark?.id;
              if (id) recordView(id);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
});
