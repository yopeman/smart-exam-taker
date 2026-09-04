import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../lib/api/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const onSubmit = async () => {
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');
    setSuccess(false);

    let hasError = false;
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token: token || '', new_password: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
              Password Reset
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              Your password has been successfully reset
            </Text>
          </View>

          <Button
            title="Go to Login"
            onPress={() => router.replace('/(auth)/login')}
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
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Create a new password
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="New Password"
            placeholder="Enter your new password"
            secureTextEntry
            autoComplete="password-new"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your new password"
            secureTextEntry
            autoComplete="password-new"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
          />

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error, fontSize: theme.typography.sizes.sm }]}>
              {error}
            </Text>
          ) : null}

          <Button
            title="Reset Password"
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
