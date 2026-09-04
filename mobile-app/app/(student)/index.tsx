import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';
import { useAttemptStore } from '../../store/attemptStore';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useTheme } from '../../lib/theme/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { availableExams, fetchExamByCode, isLoading: examsLoading } = useExamStore();
  const { myAttempts, fetchMyAttempts, isLoading: attemptsLoading, syncOfflineData, setOfflineStatus } = useAttemptStore();
  const { isOnline } = useOnlineStatus();
  const { theme } = useTheme();
  const [examCode, setExamCode] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    setOfflineStatus(!isOnline);
  }, [isOnline]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyAttempts();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]);

  const handleTakeExam = async () => {
    const code = examCode.trim();
    if (!code) {
      setCodeError('Please enter an exam code');
      return;
    }
    setCodeError('');
    const exam = await fetchExamByCode(code);
    if (exam) {
      router.push({ pathname: '/(student)/exams/[id]', params: { id: exam.id, code } });
    } else {
      setCodeError('Exam not found or not available');
    }
  };

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


        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
            Quick Actions
          </Text>

          <Card variant="elevated" style={styles.actionCard}>
            <Text style={[styles.actionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              Take an Exam
            </Text>
            <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Enter your exam code to get started
            </Text>
            <Input
              label="Exam Code"
              value={examCode}
              onChangeText={setExamCode}
              error={codeError}
              placeholder="e.g. EXAM0001"
              autoCapitalize="characters"
            />
            <Button
              title={examsLoading ? 'Checking...' : 'Start Exam'}
              onPress={handleTakeExam}
              loading={examsLoading}
            />
          </Card>

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
});
