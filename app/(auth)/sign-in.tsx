import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { space, type } from '../../src/theme/tokens';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { BackendNotice } from '../../src/components/BackendNotice';
import { DogearMark } from '../../src/components/Logo';
import { useSession } from '../../src/lib/session';

export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const { signIn, busy, secureAuth } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await signIn({ email: email.trim(), password: secureAuth ? password : undefined });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign you in.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <DogearMark size={40} />
            <Text style={[type.hookSm, { color: theme.text }]}>Welcome back</Text>
          </View>

          <BackendNotice />

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {secureAuth && (
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />
          )}

          {error ? <Text style={[type.small, { color: theme.savedText }]}>{error}</Text> : null}

          <Button label="Sign in" onPress={submit} loading={busy} />
          <Button label="Create an account instead" variant="ghost" onPress={() => router.replace('/(auth)/sign-up')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.lg, flexGrow: 1, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  header: { gap: space.sm, marginBottom: space.sm },
});
