import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend, BackendError } from './backend';
import type { Profile, SavedSpark } from './types';

interface SessionValue {
  profile: Profile | null;
  ready: boolean;
  busy: boolean;
  savedIds: Set<string>;
  saved: SavedSpark[];
  seen: string[];
  /** Spark ids read today, for the daily goal ring. */
  todayCount: number;
  streak: number;
  backendKind: 'local' | 'supabase';
  secureAuth: boolean;

  signUp: (input: { email: string; password?: string; displayName: string }) => Promise<void>;
  signIn: (input: { email: string; password?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Omit<Profile, 'id' | 'created_at'>>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  toggleSave: (spark: { spark_id: string; book_id: string }) => Promise<boolean>;
  recordView: (sparkId: string) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const ACTIVITY_KEY = 'dogear.activity';
const today = () => new Date().toISOString().slice(0, 10);

interface Activity {
  /** date -> count of sparks read */
  days: Record<string, number>;
}

const loadActivity = async (): Promise<Activity> => {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_KEY);
    return raw ? (JSON.parse(raw) as Activity) : { days: {} };
  } catch {
    return { days: {} };
  }
};

/** Counts back from today (or yesterday, so an unread today doesn't break a live streak). */
const streakFrom = (days: Record<string, number>): number => {
  const day = new Date();
  const key = (d: Date) => d.toISOString().slice(0, 10);
  if (!days[key(day)]) day.setDate(day.getDate() - 1);
  let n = 0;
  while (days[key(day)]) {
    n++;
    day.setDate(day.getDate() - 1);
  }
  return n;
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<SavedSpark[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [activity, setActivity] = useState<Activity>({ days: {} });

  // Views are batched: writing one row per card would hammer the backend during a fast scroll.
  const pendingViews = useRef<Set<string>>(new Set());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrate = useCallback(async (p: Profile | null) => {
    setProfile(p);
    if (!p) {
      setSaved([]);
      setSeen([]);
      return;
    }
    const [s, v] = await Promise.all([
      backend.listSaved().catch(() => []),
      backend.listSeen().catch(() => []),
    ]);
    setSaved(s);
    setSeen(v);
  }, []);

  useEffect(() => {
    (async () => {
      const [p, a] = await Promise.all([backend.restore().catch(() => null), loadActivity()]);
      setActivity(a);
      await hydrate(p);
      setReady(true);
    })();
  }, [hydrate]);

  const flushViews = useCallback(() => {
    const ids = [...pendingViews.current];
    pendingViews.current.clear();
    flushTimer.current = null;
    if (!ids.length) return;
    backend.markSeen(ids).catch(() => {
      // Losing view telemetry is acceptable; blocking the feed on it is not.
    });
  }, []);

  const recordView = useCallback(
    (sparkId: string) => {
      if (seen.includes(sparkId) || pendingViews.current.has(sparkId)) return;
      pendingViews.current.add(sparkId);
      setActivity((prev) => {
        const key = today();
        const next = { days: { ...prev.days, [key]: (prev.days[key] ?? 0) + 1 } };
        AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      if (!flushTimer.current) flushTimer.current = setTimeout(flushViews, 4000);
    },
    [seen, flushViews]
  );

  useEffect(() => () => flushViews(), [flushViews]);

  const guard = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<SessionValue>(() => {
    const savedIds = new Set(saved.map((s) => s.spark_id));
    return {
      profile,
      ready,
      busy,
      saved,
      savedIds,
      seen,
      todayCount: activity.days[today()] ?? 0,
      streak: streakFrom(activity.days),
      backendKind: backend.kind,
      secureAuth: backend.secureAuth,

      signUp: (input) => guard(async () => hydrate((await backend.signUp(input)).profile)),
      signIn: (input) => guard(async () => hydrate((await backend.signIn(input)).profile)),
      signOut: () =>
        guard(async () => {
          await backend.signOut();
          await hydrate(null);
        }),

      updateProfile: (patch) => guard(async () => setProfile(await backend.updateProfile(patch))),

      uploadAvatar: (uri) =>
        guard(async () => {
          const url = await backend.uploadAvatar(uri);
          setProfile(await backend.updateProfile({ avatar_url: url }));
        }),

      toggleSave: async ({ spark_id, book_id }) => {
        const isSaved = savedIds.has(spark_id);
        // Optimistic: the fold animation has to land on the same frame as the tap.
        if (isSaved) {
          setSaved((prev) => prev.filter((s) => s.spark_id !== spark_id));
          backend.unsave(spark_id).catch(() => setSaved((prev) => [...prev]));
        } else {
          const entry: SavedSpark = { spark_id, book_id, saved_at: new Date().toISOString() };
          setSaved((prev) => [entry, ...prev]);
          backend.save(entry).catch(() => setSaved((prev) => prev.filter((s) => s.spark_id !== spark_id)));
        }
        return !isSaved;
      },

      recordView,
    };
  }, [profile, ready, busy, saved, seen, activity, guard, hydrate, recordView]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

export { BackendError };
