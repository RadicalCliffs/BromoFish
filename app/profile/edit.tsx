import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius, space, type } from '../../src/theme/tokens';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { Chip } from '../../src/components/Chip';
import { useSession } from '../../src/lib/session';

const HANDLE = /^[a-z0-9_]{3,18}$/;
const GOALS = [5, 10, 20, 30];

export default function EditProfile() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile, uploadAvatar, busy } = useSession();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [goal, setGoal] = useState(profile?.daily_goal_min ?? 10);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!profile) {
    router.replace('/(auth)/welcome');
    return null;
  }

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access is off',
        'Shift for Brains needs permission to open your photo library. You can turn it on in Settings.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      await uploadAvatar(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Could not save that photo', e instanceof Error ? e.message : 'Try again in a moment.');
    }
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (displayName.trim().length < 2) next.displayName = 'A name of at least 2 characters.';
    if (!HANDLE.test(handle)) next.handle = 'Lowercase letters, numbers and underscores. 3–18 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await updateProfile({
        display_name: displayName.trim(),
        handle,
        bio: bio.trim(),
        daily_goal_min: goal,
      });
      router.back();
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Could not save your changes.' });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={[type.bodyStrong, { color: theme.text }]}>Edit profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={pickPhoto} style={styles.photo} accessibilityRole="button" accessibilityLabel="Change your profile photo">
            <Avatar uri={profile.avatar_url} name={displayName || profile.display_name} size={96} />
            <View style={[styles.photoBadge, { backgroundColor: theme.accent, borderColor: theme.bg }]}>
              <Ionicons name="camera" size={16} color={theme.onAccent} />
            </View>
          </Pressable>
          <Text style={[type.caption, { color: theme.textMuted, textAlign: 'center' }]}>TAP TO CHANGE PHOTO</Text>

          <Field
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            error={errors.displayName}
            maxLength={40}
            showCount
            autoCapitalize="words"
          />
          <Field
            label="Handle"
            value={handle}
            onChangeText={(t) => setHandle(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            error={errors.handle}
            hint="How other readers find you."
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={18}
            showCount
          />
          <Field
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="What are you trying to get better at?"
            multiline
            numberOfLines={3}
            maxLength={160}
            showCount
            style={{ minHeight: 92, textAlignVertical: 'top' }}
          />

          <View style={styles.section}>
            <Text style={[type.caption, { color: theme.textMuted }]}>DAILY GOAL</Text>
            <View style={styles.chips}>
              {GOALS.map((g) => (
                <Chip key={g} label={`${g} insights`} selected={goal === g} onPress={() => setGoal(g)} small />
              ))}
            </View>
          </View>

          {errors.form ? <Text style={[type.small, { color: theme.savedText }]}>{errors.form}</Text> : null}

          <Button label="Save changes" onPress={save} loading={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
  },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxxl, maxWidth: 520, width: '100%', alignSelf: 'center' },
  photo: { alignSelf: 'center', marginTop: space.md },
  photoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
