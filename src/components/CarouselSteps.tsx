import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';
import type { CarouselStep } from '../lib/types';

/**
 * The step-by-step format, for sparks where the idea genuinely is a sequence.
 *
 * Steps are numbered in the visible text, not just by position, so the sequence survives a
 * screen reader reading them out of a horizontal list.
 */
export function CarouselSteps({ steps, accent }: { steps: CarouselStep[]; accent: string }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const cardWidth = Math.min(width - space.xl * 2, 460);
  const listRef = useRef<FlatList<CarouselStep>>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + space.md));
    if (i !== active && i >= 0 && i < steps.length) setActive(i);
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={steps}
        horizontal
        keyExtractor={(s) => String(s.step)}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + space.md}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={{ gap: space.md }}
        renderItem={({ item }) => (
          <View
            style={[styles.card, { width: cardWidth, backgroundColor: theme.surface, borderColor: theme.border }]}
            accessible
            accessibilityLabel={`Step ${item.step} of ${steps.length}. ${item.title}. ${item.body}`}
          >
            <View style={styles.stepRow}>
              <View style={[styles.badge, { backgroundColor: accent }]}>
                <Text style={[type.caption, { color: theme.bg }]}>{item.step}</Text>
              </View>
              <Text style={[type.subtitle, { color: theme.text, flex: 1 }]}>{item.title}</Text>
            </View>
            <Text style={[type.small, { color: theme.textMuted }]}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {steps.map((s, i) => (
          <View
            key={s.step}
            style={[
              styles.dot,
              {
                backgroundColor: i === active ? accent : theme.border,
                width: i === active ? 18 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  card: { borderRadius: radius.lg, borderWidth: 1.5, padding: space.lg, gap: space.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  dot: { height: 6, borderRadius: 3 },
});
