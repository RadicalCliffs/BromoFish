import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { space, type } from '../../src/theme/tokens';
import { SparkCard } from '../../src/components/SparkCard';
import { Button } from '../../src/components/Button';
import { buildFeed } from '../../src/lib/library';
import { useSession } from '../../src/lib/session';
import type { FeedItem } from '../../src/lib/types';

/**
 * The vertical feed.
 *
 * One card fills the viewport exactly and paging is snapped, so a swipe always lands on a whole
 * card. The feed is built once per session from the profile's interests — rebuilding it on every
 * save would reshuffle the deck under the user's thumb.
 */
export default function Feed() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, savedIds, seen, toggleSave, recordView } = useSession();
  const [needsAccount, setNeedsAccount] = useState(false);
  // Measured rather than derived: the tab bar, the notch and the browser chrome all differ per
  // platform, and a card that is a few pixels off breaks snap paging in a very visible way.
  const [cardHeight, setCardHeight] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== cardHeight) setCardHeight(h);
  };

  const feed = useMemo(
    () =>
      buildFeed({
        interests: profile?.interests ?? [],
        seed: profile?.id ?? 'guest',
        seen,
        limit: 500,
      }),
    // Intentionally not depending on `seen`: it seeds the initial order, but letting it change
    // mid-scroll would reorder cards the user is looking at.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile?.id, profile?.interests?.join(',')]
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.item as FeedItem | undefined;
    if (first) recordViewRef.current(first.spark.id);
  }).current;
  // Kept in a ref so the callback identity stays stable — FlatList warns if it changes.
  const recordViewRef = useRef(recordView);
  recordViewRef.current = recordView;

  const onSave = useCallback(
    (item: FeedItem) => {
      if (!profile) {
        setNeedsAccount(true);
        return;
      }
      toggleSave({ spark_id: item.spark.id, book_id: item.bookId });
    },
    [profile, toggleSave]
  );

  if (!feed.length) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.bg }]}>
        <Text style={[type.title, { color: theme.text, textAlign: 'center' }]}>The library is still building.</Text>
        <Text style={[type.small, { color: theme.textMuted, textAlign: 'center' }]}>
          Run `npm run content:all` to compile the book library into the app.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }} onLayout={onLayout}>
      {cardHeight > 0 && (
      <FlatList
        data={feed}
        keyExtractor={(i) => i.spark.id}
        renderItem={({ item }) => (
          <SparkCard
            item={item}
            height={cardHeight}
            saved={savedIds.has(item.spark.id)}
            onToggleSave={() => onSave(item)}
          />
        )}
        pagingEnabled
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: cardHeight, offset: cardHeight * index, index })}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
      />
      )}

      {needsAccount && (
        <View style={[styles.prompt, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[type.bodyStrong, { color: theme.text }]}>Saving needs an account</Text>
          <Text style={[type.small, { color: theme.textMuted }]}>
            It takes about ten seconds, and your feed gets better immediately.
          </Text>
          <Button label="Create an account" onPress={() => router.push('/(auth)/sign-up')} />
          <Button label="Not now" variant="ghost" onPress={() => setNeedsAccount(false)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  prompt: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    borderWidth: 1.5,
    borderRadius: 22,
    padding: space.lg,
    gap: space.sm,
  },
});
