import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, SavedSpark } from '../types';
import { Backend, BackendError } from './types';

const K = {
  profile: 'shift.local.profile',
  saved: 'shift.local.saved',
  seen: 'shift.local.seen',
};

const read = async <T,>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value));

const handleFrom = (name: string, email: string) => {
  const base = (name || email.split('@')[0] || 'reader').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return (base || 'reader').slice(0, 18);
};

/**
 * On-device backend.
 *
 * There is deliberately no password here. Storing one would mean either keeping it in
 * plaintext or hashing it with something that only looks like security on a device where the
 * attacker already has the filesystem. The app says so plainly in the auth screens instead.
 */
export const localBackend: Backend = {
  kind: 'local',
  secureAuth: false,

  async restore() {
    return read<Profile | null>(K.profile, null);
  },

  async signUp({ email, displayName }) {
    const existing = await read<Profile | null>(K.profile, null);
    if (existing) throw new BackendError('This device already has a profile. Sign in instead.', 'exists');
    const profile: Profile = {
      id: `local-${Date.now().toString(36)}`,
      handle: handleFrom(displayName, email),
      display_name: displayName.trim() || 'Reader',
      bio: '',
      avatar_url: null,
      interests: [],
      created_at: new Date().toISOString(),
      daily_goal_min: 10,
    };
    await write(K.profile, profile);
    return { profile };
  },

  async signIn() {
    const profile = await read<Profile | null>(K.profile, null);
    if (!profile) throw new BackendError('No profile on this device yet. Create one first.', 'no-account');
    return { profile };
  },

  async signOut() {
    // The profile survives sign-out on purpose: with no server there is nowhere to sign back
    // in from, so clearing it would silently destroy the user's saves.
  },

  async updateProfile(patch) {
    const current = await read<Profile | null>(K.profile, null);
    if (!current) throw new BackendError('Not signed in.', 'no-session');
    const next = { ...current, ...patch };
    await write(K.profile, next);
    return next;
  },

  async uploadAvatar(uri) {
    // The picked file already lives in the app's own document directory, so the local uri is
    // a perfectly good permanent reference.
    return uri;
  },

  async listSaved() {
    return read<SavedSpark[]>(K.saved, []);
  },

  async save(spark) {
    const saved = await read<SavedSpark[]>(K.saved, []);
    if (saved.some((s) => s.spark_id === spark.spark_id)) return;
    await write(K.saved, [spark, ...saved]);
  },

  async unsave(sparkId) {
    const saved = await read<SavedSpark[]>(K.saved, []);
    await write(K.saved, saved.filter((s) => s.spark_id !== sparkId));
  },

  async listSeen() {
    return read<string[]>(K.seen, []);
  },

  async markSeen(sparkIds) {
    const seen = await read<string[]>(K.seen, []);
    const merged = [...new Set([...seen, ...sparkIds])];
    // Unbounded growth would eventually make every read expensive for no benefit.
    await write(K.seen, merged.slice(-4000));
  },
};
