import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Profile, SavedSpark } from '../types';
import { Backend, BackendError } from './types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // React Native has no url bar to parse a session out of.
        detectSessionInUrl: false,
      },
    })
  : null;

const client = (): SupabaseClient => {
  if (!supabase) throw new BackendError('Supabase is not configured.', 'not-configured');
  return supabase;
};

const requireUser = async () => {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw new BackendError('Not signed in.', 'no-session');
  return data.user;
};

const rowToProfile = (row: Record<string, unknown>): Profile => ({
  id: String(row.id),
  handle: String(row.handle ?? ''),
  display_name: String(row.display_name ?? ''),
  bio: String(row.bio ?? ''),
  avatar_url: (row.avatar_url as string | null) ?? null,
  interests: (row.interests as string[] | null) ?? [],
  created_at: String(row.created_at ?? new Date().toISOString()),
  daily_goal_min: Number(row.daily_goal_min ?? 10),
});

const loadProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await client().from('profiles').select('*').eq('id', userId).single();
  if (error) throw new BackendError(error.message, error.code ?? 'profile-read');
  return rowToProfile(data);
};

export const supabaseBackend: Backend = {
  kind: 'supabase',
  secureAuth: true,

  async restore() {
    const { data } = await client().auth.getSession();
    if (!data.session) return null;
    try {
      return await loadProfile(data.session.user.id);
    } catch {
      // A valid session with no profile row means the trigger has not fired yet. Treat it as
      // signed out rather than crashing the app on launch.
      return null;
    }
  },

  async signUp({ email, password, displayName }) {
    if (!password) throw new BackendError('A password is required.', 'no-password');
    const { data, error } = await client().auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new BackendError(error.message, error.code ?? 'signup');
    // If the user exists but is not confirmed, email confirmation is required.
    if (!data.session) throw new BackendError('Check your inbox to confirm your email, then sign in.', 'confirm-email');
    return { profile: await loadProfile(data.user!.id) };
  },

  async signIn({ email, password }) {
    if (!password) throw new BackendError('A password is required.', 'no-password');
    const { data, error } = await client().auth.signInWithPassword({ email, password });
    if (error) throw new BackendError(error.message, error.code ?? 'signin');
    return { profile: await loadProfile(data.user.id) };
  },

  async signOut() {
    await client().auth.signOut();
  },

  async updateProfile(patch) {
    const user = await requireUser();
    const { data, error } = await client().from('profiles').update(patch).eq('id', user.id).select().single();
    if (error) throw new BackendError(error.message, error.code ?? 'profile-update');
    return rowToProfile(data);
  },

  async uploadAvatar(uri) {
    const user = await requireUser();
    const response = await fetch(uri);
    const blob = await response.arrayBuffer();
    const ext = uri.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    // Overwriting a per-user path keeps storage from filling with abandoned avatars.
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await client()
      .storage.from('avatars')
      .upload(path, blob, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
    if (error) throw new BackendError(error.message, 'avatar-upload');
    const { data } = client().storage.from('avatars').getPublicUrl(path);
    // Cache-bust so the new image shows immediately after an upsert to the same path.
    return `${data.publicUrl}?v=${Date.now()}`;
  },

  async listSaved() {
    const user = await requireUser();
    const { data, error } = await client()
      .from('saved_sparks')
      .select('spark_id, book_id, saved_at, note')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });
    if (error) throw new BackendError(error.message, 'saved-read');
    return (data ?? []) as SavedSpark[];
  },

  async save(spark) {
    const user = await requireUser();
    const { error } = await client()
      .from('saved_sparks')
      .upsert({ user_id: user.id, ...spark }, { onConflict: 'user_id,spark_id' });
    if (error) throw new BackendError(error.message, 'save');
  },

  async unsave(sparkId) {
    const user = await requireUser();
    const { error } = await client().from('saved_sparks').delete().eq('user_id', user.id).eq('spark_id', sparkId);
    if (error) throw new BackendError(error.message, 'unsave');
  },

  async listSeen() {
    const user = await requireUser();
    const { data, error } = await client()
      .from('spark_views')
      .select('spark_id')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(4000);
    if (error) throw new BackendError(error.message, 'seen-read');
    return (data ?? []).map((r) => String(r.spark_id));
  },

  async markSeen(sparkIds) {
    if (!sparkIds.length) return;
    const user = await requireUser();
    const rows = sparkIds.map((spark_id) => ({ user_id: user.id, spark_id }));
    // Views are best-effort telemetry for feed ranking; a failure here must never break the feed.
    await client().from('spark_views').upsert(rows, { onConflict: 'user_id,spark_id' });
  },
};
