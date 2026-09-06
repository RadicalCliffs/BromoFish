/// <reference types="expo/types" />

// Expo inlines EXPO_PUBLIC_* variables at build time. Declaring only the keys the app reads
// keeps a typo in an env var name a compile error rather than a silent undefined.
declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
  };
};
