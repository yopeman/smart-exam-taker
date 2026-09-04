import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../lib/api/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setEmailError('');
    setError('');
    setSuccess(false);

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
              Check Your Email
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              We've sent a password reset link to your email
            </Text>
          </View>

          <Button
            title="Back to Login"
            onPress={() => router.push('/(auth)/login')}
            style={styles.button}
          />
        </ScrollView>
      </View>
    );
  }

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
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
            Forgot Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Enter your email to reset your password
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

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error, fontSize: theme.typography.sizes.sm }]}>
              {error}
            </Text>
          )}

          <Button
            title="Send Reset Link"
            onPress={onSubmit}
            loading={isSubmitting}
            style={styles.button}
          />

          <Text
            style={[styles.backLink, { color: theme.colors.primary, fontSize: theme.typography.sizes.sm }]}
            onPress={() => router.back()}
          >
            Back to Login
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
    textAlign: 'center',
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
  backLink: {
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
