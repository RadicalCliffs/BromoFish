import { localBackend } from './local';
import { isSupabaseConfigured, supabaseBackend } from './supabase';
import type { Backend } from './types';

/**
 * The app runs fully offline out of the box. Set EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY (see .env.example) and the same UI starts talking to a real
 * project instead — no other code changes.
 */
export const backend: Backend = isSupabaseConfigured ? supabaseBackend : localBackend;

export { isSupabaseConfigured };
export type { Backend } from './types';
export { BackendError } from './types';
