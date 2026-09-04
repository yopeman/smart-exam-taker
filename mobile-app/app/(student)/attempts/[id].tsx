import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAttemptStore } from '../../../store/attemptStore';
import { useTheme } from '../../../lib/theme/theme';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function AttemptDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentAttempt, fetchAttemptById, isLoading } = useAttemptStore();
  const { theme } = useTheme();

  const attemptId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (attemptId) {
      fetchAttemptById(attemptId);
    }
  }, [attemptId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return theme.colors.success;
      case 'submitted':
      case 'processing':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Loading attempt...
          </Text>
        </View>
      </View>
    );
  }

  if (!currentAttempt) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Attempt not found
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
            Attempt Details
          </Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Student
            </Text>
            <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              {currentAttempt.student_first_name} {currentAttempt.student_last_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Student ID
            </Text>
            <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              {currentAttempt.student_id_number}
            </Text>
          </View>

          {currentAttempt.department && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Department
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {currentAttempt.department}
              </Text>
            </View>
          )}

          {currentAttempt.year_of_study && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Year of Study
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {currentAttempt.year_of_study}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Status
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentAttempt.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(currentAttempt.status), fontSize: theme.typography.sizes.sm }]}>
                {getStatusText(currentAttempt.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Started
            </Text>
            <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              {new Date(currentAttempt.started_at).toLocaleString()}
            </Text>
          </View>

          {currentAttempt.submitted_at && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Submitted
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {new Date(currentAttempt.submitted_at).toLocaleString()}
              </Text>
            </View>
          )}

          {currentAttempt.graded_at && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Graded
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {new Date(currentAttempt.graded_at).toLocaleString()}
              </Text>
            </View>
          )}
        </Card>

        {currentAttempt.total_score !== null && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
              Scores
            </Text>

            {currentAttempt.objective_score !== null && (
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
                  Objective Score
                </Text>
                <Text style={[styles.scoreValue, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
                  {currentAttempt.objective_score}
                </Text>
              </View>
            )}

            {currentAttempt.ai_score !== null && (
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
                  AI Score
                </Text>
                <Text style={[styles.scoreValue, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
                  {currentAttempt.ai_score}
                </Text>
              </View>
            )}

            <View style={[styles.totalScoreRow, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.totalScoreLabel, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
                Total Score
              </Text>
              <Text style={[styles.totalScoreValue, { color: theme.colors.primary, fontSize: theme.typography.sizes['2xl'] }]}>
                {currentAttempt.total_score}
              </Text>
            </View>
          </Card>
        )}

        {currentAttempt.grading_details && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
              Grading Details
            </Text>
            <Text style={[styles.detailsText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              {typeof currentAttempt.grading_details === 'string' 
                ? currentAttempt.grading_details 
                : JSON.stringify(currentAttempt.grading_details, null, 2)}
            </Text>
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Back to Attempts"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
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
    marginBottom: 16,
  },
  scoreRow: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
  },
  scoreValue: {
    fontWeight: '600',
  },
  totalScoreRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalScoreLabel: {
    fontWeight: '600',
  },
  totalScoreValue: {
    fontWeight: 'bold',
  },
  detailsText: {
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
  },
  button: {
  },
});
