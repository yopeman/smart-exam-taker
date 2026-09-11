import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExamStore } from '../../../store/examStore';
import { useTheme } from '../../../lib/theme/theme';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function ExamDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { examByCode, fetchStudentExamById, isLoading, error } = useExamStore();
  const { theme } = useTheme();

  const examId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (examId) {
      fetchStudentExamById(examId);
    }
  }, [examId]);

  const currentExam = examByCode;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Loading exam...
          </Text>
        </View>
      </View>
    );
  }

  if (!currentExam) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            {error || 'Exam not found'}
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
            {currentExam.title}
          </Text>
          {currentExam.description && (
            <Text style={[styles.description, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              {currentExam.description}
            </Text>
          )}
        </View>

        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Duration
            </Text>
            <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              {currentExam.duration_minutes} minutes
            </Text>
          </View>

          {currentExam.department && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Department
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {currentExam.department}
              </Text>
            </View>
          )}

          {currentExam.year_of_study && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Year of Study
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {currentExam.year_of_study}
              </Text>
            </View>
          )}

          {currentExam.semester && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Semester
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {currentExam.semester}
              </Text>
            </View>
          )}

          {currentExam.section && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Section
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {currentExam.section}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Status
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentExam.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(currentExam.status), fontSize: theme.typography.sizes.sm }]}>
                {currentExam.status.charAt(0).toUpperCase() + currentExam.status.slice(1)}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
            Instructions
          </Text>
          <Text style={[styles.instructions, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
            • Make sure you have a stable internet connection
          </Text>
          <Text style={[styles.instructions, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
            • You will need to capture your face before starting
          </Text>
          <Text style={[styles.instructions, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
            • The exam will be automatically submitted when time expires
          </Text>
          <Text style={[styles.instructions, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
            • Your answers are saved automatically
          </Text>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Start Exam"
            onPress={() => router.push({ pathname: '/(student)/exams/take', params: { id: examId } })}
            style={styles.startButton}
          />
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'started':
      return '#F59E0B';
    case 'completed':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#3B82F6';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
  },
  errorText: {
    marginBottom: 16,
  },
  backButton: {
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
  },
  card: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
  },
  value: {
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  instructions: {
    marginBottom: 8,
  },
  buttonContainer: {
    padding: 24,
    gap: 12,
  },
  startButton: {
  },
  cancelButton: {
  },
});
