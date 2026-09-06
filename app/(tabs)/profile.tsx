import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemePreference } from '../../src/theme/ThemeProvider';
import { radius, space, type } from '../../src/theme/tokens';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { ProgressRing } from '../../src/components/ProgressRing';
import { BackendNotice } from '../../src/components/BackendNotice';
import { getCategory } from '../../src/lib/library';
import { useSession } from '../../src/lib/session';

export default function ProfileTab() {
  const theme = useTheme();
  const router = useRouter();
  const { preference, setPreference } = useThemePreference();
  const { profile, saved, streak, todayCount, seen, signOut, busy } = useSession();

  if (!profile) {
    return (
      <SafeAreaView style={[styles.empty, { backgroundColor: theme.bg }]}>
        <Text style={[type.title, { color: theme.text, textAlign: 'center' }]}>You are browsing as a guest</Text>
        <Text style={[type.small, { color: theme.textMuted, textAlign: 'center' }]}>
          An account keeps your saves, your streak and a feed shaped around what you actually read.
        </Text>
        <Button label="Create an account" onPress={() => router.push('/(auth)/sign-up')} full={false} />
        <Button label="Sign in" variant="ghost" onPress={() => router.push('/(auth)/sign-in')} full={false} />
      </SafeAreaView>
    );
  }

  const interestCategories = profile.interests
    .map((i) => getCategory(i))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const looseTags = profile.interests.filter((i) => !getCategory(i));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Avatar uri={profile.avatar_url} name={profile.display_name} size={76} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.title, { color: theme.text }]} numberOfLines={1}>
              {profile.display_name}
            </Text>
            <Text style={[type.small, { color: theme.textMuted }]}>@{profile.handle}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/profile/edit')}
            accessibilityRole="button"
            accessibilityLabel="Edit your profile"
            hitSlop={10}
            style={[styles.iconBtn, { borderColor: theme.borderStrong }]}
          >
            <Ionicons name="create-outline" size={20} color={theme.text} />
          </Pressable>
        </View>

        {profile.bio ? <Text style={[type.body, { color: theme.text }]}>{profile.bio}</Text> : null}

        <View style={[styles.stats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statCell}>
            <ProgressRing value={todayCount} goal={profile.daily_goal_min} size={58} />
            <Text style={[type.caption, { color: theme.textMuted }]}>TODAY</Text>
          </View>
          <Stat value={String(streak)} label={streak === 1 ? 'DAY STREAK' : 'DAY STREAK'} />
          <Stat value={String(saved.length)} label="SAVED" />
          <Stat value={String(seen.length)} label="READ" />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[type.overline, { color: theme.textMuted }]}>YOUR INTERESTS</Text>
            <Pressable
              onPress={() => router.push({ pathname: '/(auth)/interests', params: { mode: 'edit' } })}
              accessibilityRole="button"
              accessibilityLabel="Edit your interests"
            >
              <Text style={[type.caption, { color: theme.accentText }]}>EDIT</Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {interestCategories.map((c) => (
              <Chip key={c.id} label={c.label} selected accent={c.accent} accentForeground={c.foreground} small />
            ))}
            {looseTags.map((t) => (
              <Chip key={t} label={t.replace(/-/g, ' ')} small />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[type.overline, { color: theme.textMuted }]}>APPEARANCE</Text>
          <View style={styles.chips}>
            {(['system', 'light', 'dark'] as const).map((p) => (
              <Chip
                key={p}
                label={p === 'system' ? 'Match device' : p === 'light' ? 'Light' : 'Dark'}
                selected={preference === p}
                onPress={() => setPreference(p)}
                small
              />
            ))}
          </View>
        </View>

        <BackendNotice />

        <Button label="Sign out" variant="danger" onPress={signOut} loading={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.statCell} accessible accessibilityLabel={`${value} ${label.toLowerCase()}`}>
      <Text style={[type.title, { color: theme.text }]}>{value}</Text>
      <Text style={[type.caption, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', borderWidth: 1.5, borderRadius: radius.lg, paddingVertical: space.lg },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  section: { gap: space.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
