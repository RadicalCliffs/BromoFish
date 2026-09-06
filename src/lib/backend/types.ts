import type { Profile, SavedSpark } from '../types';

export interface AuthResult {
  profile: Profile;
}

/**
 * Everything the app needs from a backend.
 *
 * Two implementations exist. `local` keeps everything in AsyncStorage so the app is fully
 * usable with no server at all; `supabase` talks to a real project once the two public env
 * vars are set. The UI never branches on which one is active — it only reads `backend.kind`
 * to tell the user honestly where their data is going.
 */
export interface Backend {
  kind: 'local' | 'supabase';
  /** True when this backend actually authenticates a password. */
  secureAuth: boolean;

  restore(): Promise<Profile | null>;
  signUp(input: { email: string; password?: string; displayName: string }): Promise<AuthResult>;
  signIn(input: { email: string; password?: string }): Promise<AuthResult>;
  signOut(): Promise<void>;

  updateProfile(patch: Partial<Omit<Profile, 'id' | 'created_at'>>): Promise<Profile>;
  /** Takes a local file uri, returns the url to store on the profile. */
  uploadAvatar(uri: string): Promise<string>;

  listSaved(): Promise<SavedSpark[]>;
  save(spark: SavedSpark): Promise<void>;
  unsave(sparkId: string): Promise<void>;

  listSeen(): Promise<string[]>;
  markSeen(sparkIds: string[]): Promise<void>;
}

export class BackendError extends Error {
  constructor(message: string, readonly code: string = 'unknown') {
    super(message);
    this.name = 'BackendError';
  }
}
