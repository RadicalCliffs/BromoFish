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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignUp() {
  const theme = useTheme();
  const router = useRouter();
  const { signUp, busy, secureAuth } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Tell us what to call you.';
    if (!EMAIL.test(email.trim())) next.email = 'That does not look like an email address.';
    if (secureAuth && password.length < 8) next.password = 'At least 8 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    try {
      await signUp({ email: email.trim(), password: secureAuth ? password : undefined, displayName: name.trim() });
      router.replace('/(auth)/interests');
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'Could not create your account.' });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <DogearMark size={40} />
            <Text style={[type.hookSm, { color: theme.text }]}>Start your library</Text>
            <Text style={[type.small, { color: theme.textMuted }]}>
              Pick what you care about next, and your feed is built around it.
            </Text>
          </View>

          <BackendNotice />

          <Field
            label="Your name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            placeholder="Sam Rivers"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={40}
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
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
              error={errors.password}
              hint="At least 8 characters."
              placeholder="••••••••"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
          )}

          {errors.form ? <Text style={[type.small, { color: theme.savedText }]}>{errors.form}</Text> : null}

          <Button label="Create account" onPress={submit} loading={busy} />
          <Button label="I already have an account" variant="ghost" onPress={() => router.replace('/(auth)/sign-in')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, gap: space.lg, flexGrow: 1, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  header: { gap: space.sm, marginBottom: space.sm },
});
