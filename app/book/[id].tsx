import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, space, type } from '../../src/theme/tokens';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { DogearButton } from '../../src/components/DogearButton';
import { BookRow } from '../../src/components/BookRow';
import { getBook, getCategory } from '../../src/lib/library';
import { useSession } from '../../src/lib/session';

export default function BookDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savedIds, toggleSave, profile } = useSession();
  const book = getBook(String(id));

  if (!book) {
    return (
      <SafeAreaView style={[styles.empty, { backgroundColor: theme.bg }]}>
        <Text style={[type.title, { color: theme.text }]}>That book is not in the library.</Text>
        <Button label="Go back" onPress={() => router.back()} full={false} />
      </SafeAreaView>
    );
  }

  const category = getCategory(book.category);
  const accent = category?.accent ?? theme.accent;
  const wash = theme.name === 'dark' ? category?.tintDark ?? theme.surface : category?.tint ?? theme.surfaceLift;
  const related = (book.if_you_liked ?? []).map((s) => getBook(s)).filter((b): b is NonNullable<typeof b> => !!b);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <LinearGradient colors={[wash, theme.bg]} locations={[0, 0.42]} style={styles.wash} pointerEvents="none" />
      <View style={styles.bar}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Chip label={category?.label ?? book.category} selected accent={accent} accentForeground={category?.foreground} small />
        <Text style={[type.hookSm, { color: theme.text }]} accessibilityRole="header">
          {book.title}
        </Text>
        {book.subtitle ? <Text style={[type.body, { color: theme.textMuted }]}>{book.subtitle}</Text> : null}
        <Text style={[type.bodyStrong, { color: theme.text }]}>
          {book.author} · {book.year}
        </Text>

        <View style={styles.metaRow}>
          <Meta icon="layers-outline" label={`${book.sparks.length} insights`} />
          <Meta icon="time-outline" label={`${book.read_time_min ?? 10} min`} />
          <Meta icon="barbell-outline" label={book.difficulty} />
        </View>

        <View style={[styles.crux, { backgroundColor: theme.surface, borderLeftColor: accent }]}>
          <Text style={[type.overline, { color: theme.textMuted }]}>THE CRUX</Text>
          <Text style={[type.subtitle, { color: theme.text }]}>{book.crux.headline}</Text>
          <Text style={[type.small, { color: theme.textMuted }]}>{book.crux.body}</Text>
        </View>

        <Button
          label="Read all the insights"
          onPress={() => router.push({ pathname: '/read/[bookId]', params: { bookId: book.id } })}
          icon={<Ionicons name="play" size={16} color={theme.onAccent} />}
        />

        <Section title="WHY IT MATTERS">
          <Text style={[type.body, { color: theme.text }]}>{book.why_it_matters}</Text>
        </Section>

        <Section title={`${book.sparks.length} INSIGHTS`}>
          {book.sparks.map((spark, i) => (
            <Pressable
              key={spark.id}
              onPress={() =>
                router.push({ pathname: '/read/[bookId]', params: { bookId: book.id, start: String(i) } })
              }
              accessibilityRole="link"
              accessibilityLabel={`Insight ${i + 1}: ${spark.hook}`}
              style={({ pressed }) => [
                styles.sparkRow,
                { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[type.caption, { color: theme.textMuted, width: 22 }]}>{i + 1}</Text>
              <Text style={[type.small, { color: theme.text, flex: 1, fontWeight: '600' }]}>{spark.hook}</Text>
              <DogearButton
                saved={savedIds.has(spark.id)}
                size={20}
                onToggle={() => {
                  if (!profile) {
                    router.push('/(auth)/sign-up');
                    return;
                  }
                  toggleSave({ spark_id: spark.id, book_id: book.id });
                }}
              />
            </Pressable>
          ))}
        </Section>

        <Section title="DO THIS AFTER">
          {book.actions.map((a, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={[styles.actionDot, { backgroundColor: accent }]} />
              <Text style={[type.small, { color: theme.text, flex: 1 }]}>{a}</Text>
            </View>
          ))}
        </Section>

        <Section title="SKIP IT IF">
          <Text style={[type.small, { color: theme.textMuted }]}>{book.not_for_you_if}</Text>
        </Section>

        {related.length > 0 && (
          <Section title="IF YOU LIKED THIS">
            {related.map((b) => (
              <BookRow key={b.id} book={b} />
            ))}
          </Section>
        )}

        <View style={[styles.provenance, { borderColor: theme.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={theme.textMuted} />
          <Text style={[type.caption, { color: theme.textMuted, flex: 1, fontWeight: '400' }]}>
            Every insight on Shift for Brains is written from scratch — no wording is reproduced from the
            original text.
            {book.verification.notes ? ` ${book.verification.notes}` : ''}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[type.overline, { color: theme.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

function Meta({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.meta} accessible accessibilityLabel={label}>
      <Ionicons name={icon} size={15} color={theme.textMuted} />
      <Text style={[type.caption, { color: theme.textMuted, fontWeight: '400' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 340 },
  bar: { paddingHorizontal: space.lg, paddingVertical: space.sm },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl },
  metaRow: { flexDirection: 'row', gap: space.lg, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  crux: { borderLeftWidth: 4, borderRadius: radius.md, padding: space.lg, gap: space.xs },
  section: { gap: space.sm, marginTop: space.md },
  sparkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1.5, borderRadius: radius.md, padding: space.md },
  actionRow: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  actionDot: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
  provenance: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', borderWidth: 1, borderRadius: radius.md, padding: space.md, marginTop: space.lg },
});
