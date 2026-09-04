import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';
import { useAttemptStore } from '../../store/attemptStore';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTheme } from '../../lib/theme/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { availableExams, fetchAvailableExams, isLoading: examsLoading } = useExamStore();
  const { myAttempts, fetchMyAttempts, isLoading: attemptsLoading, syncOfflineData, setOfflineStatus } = useAttemptStore();
  const { isOnline } = useOnlineStatus();
  const { theme } = useTheme();

  useEffect(() => {
    setOfflineStatus(!isOnline);
  }, [isOnline]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableExams();
      fetchMyAttempts();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const availableCount = availableExams.filter(e => e.is_available && !e.has_attempted).length;
  const completedCount = myAttempts.filter(a => a.status === 'graded').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
            {user?.name}
          </Text>
          {!isOnline && (
            <View style={[styles.offlineBadge, { backgroundColor: theme.colors.warning + '20' }]}>
              <Text style={[styles.offlineText, { color: theme.colors.warning, fontSize: theme.typography.sizes.xs }]}>
                Offline Mode
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.primary, fontSize: theme.typography.sizes['3xl'] }]}>
              {availableCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Available Exams
            </Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <Text style={[styles.statNumber, { color: theme.colors.secondary, fontSize: theme.typography.sizes['3xl'] }]}>
              {completedCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Completed
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
            Quick Actions
          </Text>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(student)/exams')}
          >
            <Text style={[styles.actionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              View Available Exams
            </Text>
            <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Take exams assigned to you
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(student)/attempts')}
          >
            <Text style={[styles.actionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              My Attempts
            </Text>
            <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              View your exam history
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/(student)/profile')}
          >
            <Text style={[styles.actionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              Profile Settings
            </Text>
            <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Manage your account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  offlineText: {
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    textAlign: 'center',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  actionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
  },
  logoutButton: {
    marginTop: 8,
  },
});
