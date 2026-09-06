import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, type } from '../theme/tokens';
import { getCategory } from '../lib/library';
import type { FeedItem } from '../lib/types';
import { CarouselSteps } from './CarouselSteps';
import { DogearButton } from './DogearButton';

interface Props {
  item: FeedItem;
  height: number;
  saved: boolean;
  onToggleSave: () => void;
}

/**
 * One full-screen card in the vertical feed.
 *
 * The information hierarchy is deliberate and always the same, so the eye learns where to look
 * after two or three swipes: the hook is the only thing at display size, the insight carries
 * the idea, `why` earns your trust, and `apply` is the one thing to do. Everything else is
 * chrome and stays quiet.
 */
export function SparkCard({ item, height, saved, onToggleSave }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const category = getCategory(item.category);
  const accent = category?.accent ?? theme.accent;
  const dark = theme.name === 'dark';
  const wash = dark ? category?.tintDark ?? theme.surface : category?.tint ?? theme.surfaceLift;

  const onShare = () => {
    Share.share({
      message: `${item.spark.hook}\n\n${item.spark.insight}\n\n— from ${item.title} by ${item.author}, via Dogear`,
    }).catch(() => {
      // The user dismissing the share sheet is not an error worth surfacing.
    });
  };

  return (
    <View style={{ height }}>
      <LinearGradient
        colors={[wash, theme.bg, theme.bg]}
        locations={[0, 0.55, 1]}
        style={styles.fill}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.content, { paddingBottom: space.xxxl * 2 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <Pressable
            onPress={() => router.push({ pathname: '/category/[id]', params: { id: item.category } })}
            accessibilityRole="link"
            accessibilityLabel={`Category: ${category?.label ?? item.category}. Opens the category.`}
            style={[styles.categoryPill, { backgroundColor: accent }]}
          >
            <Text style={[type.overline, { color: category?.foreground ?? theme.onAccent }]}>
              {(category?.short ?? item.category).toUpperCase()}
            </Text>
          </Pressable>
          <Text style={[type.caption, { color: theme.textMuted }]}>
            {item.index} of {item.total}
          </Text>
        </View>

        <Text
          style={[item.spark.hook.length > 62 ? type.hookSm : type.hook, styles.hook, { color: theme.text }]}
          accessibilityRole="header"
        >
          {item.spark.hook}
        </Text>

        <Text style={[type.body, { color: theme.text }]}>{item.spark.insight}</Text>

        {item.spark.format === 'carousel' && item.spark.carousel && (
          <CarouselSteps steps={item.spark.carousel} accent={accent} />
        )}

        <View style={[styles.block, { borderColor: theme.border }]}>
          <Text style={[type.overline, { color: theme.textMuted }]}>WHY IT HOLDS</Text>
          <Text style={[type.small, { color: theme.textMuted }]}>{item.spark.why}</Text>
        </View>

        <View style={[styles.apply, { backgroundColor: theme.surface, borderLeftColor: accent }]}>
          <Text style={[type.overline, { color: accent === theme.accent ? theme.accentText : accent }]}>DO THIS</Text>
          <Text style={[type.bodyStrong, { color: theme.text }]}>{item.spark.apply}</Text>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: item.bookId } })}
          accessibilityRole="link"
          accessibilityLabel={`From ${item.title} by ${item.author}, ${item.year}. Opens the full book.`}
          style={({ pressed }) => [styles.source, { borderColor: theme.borderStrong, opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[type.caption, { color: theme.textMuted }]}>FROM</Text>
            <Text style={[type.bodyStrong, { color: theme.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[type.small, { color: theme.textMuted }]} numberOfLines={1}>
              {item.author} · {item.year}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </Pressable>
      </ScrollView>

      <View style={styles.rail} pointerEvents="box-none">
        <DogearButton saved={saved} onToggle={onToggleSave} size={32} showLabel />
        <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share this spark" style={styles.railBtn}>
          <Ionicons name="arrow-redo-outline" size={26} color={theme.text} />
          <Text style={[type.overline, { color: theme.textMuted, marginTop: 4 }]}>SHARE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  content: { paddingHorizontal: space.xl, paddingTop: space.xxl, gap: space.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  categoryPill: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill },
  hook: { marginTop: space.xs },
  block: { borderTopWidth: 1, paddingTop: space.md, gap: space.xs },
  apply: { borderLeftWidth: 4, borderRadius: radius.md, padding: space.lg, gap: space.xs },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: space.lg,
  },
  rail: { position: 'absolute', right: space.md, bottom: space.xxl, alignItems: 'center', gap: space.lg },
  railBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 },
});
