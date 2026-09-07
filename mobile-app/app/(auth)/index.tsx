import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../lib/theme/theme';

export default function AuthIndex() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useAuthStore();
  const { theme } = useTheme();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    loadUser().then(() => setHasChecked(true));
  }, []);

  useEffect(() => {
    if (hasChecked) {
      if (isAuthenticated) {
        router.replace('/(student)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [hasChecked]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.text, { color: theme.colors.text }]}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});
