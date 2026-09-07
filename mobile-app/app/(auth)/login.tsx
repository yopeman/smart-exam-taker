import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const onSubmit = async () => {
    setEmailError('');
    setPasswordError('');
    clearError();

    let hasError = false;
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.replace('/(student)');
    } catch (err) {
      // Error is handled by the store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['3xl'] }]}>
            Smart Exam Taker
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Sign in to take your exams
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={emailError}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
          />

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error, fontSize: theme.typography.sizes.sm }]}>
              {error}
            </Text>
          ) : null}

          <Button
            title="Sign In"
            onPress={onSubmit}
            loading={isSubmitting || isLoading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Don't have an account?
            </Text>
            <Text
              style={[styles.link, { color: theme.colors.primary, fontSize: theme.typography.sizes.sm }]}
              onPress={() => router.push('/(auth)/register')}
            >
              Sign Up
            </Text>
          </View>

          <Text
            style={[styles.forgotPassword, { color: theme.colors.primary, fontSize: theme.typography.sizes.sm }]}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            Forgot Password?
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    marginRight: 4,
  },
  link: {
    fontWeight: '600',
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
