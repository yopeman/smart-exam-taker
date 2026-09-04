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

  const renderStudentAnswer = (detail: any) => {
    const { type, answer } = detail;
    if (type === 'short_answer' || type === 'essay') {
      return answer == null || answer === '' ? 'No answer submitted' : String(answer);
    }
    if (type === 'true_false') {
      return answer === true ? 'True' : answer === false ? 'False' : '—';
    }
    if (type === 'matching' && answer && typeof answer === 'object') {
      const map = answer as Record<string, unknown>;
      return Object.entries(map)
        .map(([l, r]) => `${parseInt(l, 10) + 1}→${Number(r) + 1}`)
        .join(', ');
    }
    if (answer == null) return 'No answer submitted';
    if (Array.isArray(answer)) return answer.map(String).join(', ');
    return String(answer);
  };

  const getCorrectnessColor = (correctness: string) => {
    switch (correctness) {
      case 'correct':
        return theme.colors.success;
      case 'partial':
        return theme.colors.warning;
      default:
        return theme.colors.error;
    }
  };

  const gradingDetails: any[] = Array.isArray(currentAttempt.grading_details)
    ? currentAttempt.grading_details
    : [];

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

        {gradingDetails.length > 0 && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
              Grading Details
            </Text>
            {gradingDetails.map((d: any, i: number) => (
              <View
                key={i}
                style={[
                  styles.detailCard,
                  { borderColor: theme.colors.border },
                ]}
              >
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                    {d.question_id || `Q${i + 1}`}
                  </Text>
                  {d.correctness != null && (
                    <View
                      style={[
                        styles.correctnessBadge,
                        { backgroundColor: getCorrectnessColor(d.correctness) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.correctnessText,
                          { color: getCorrectnessColor(d.correctness), fontSize: theme.typography.sizes.xs },
                        ]}
                      >
                        {d.correctness}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.detailMeta, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                  {d.type} · {d.point ?? d.points} pts
                </Text>

                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                  Your Answer
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                  {renderStudentAnswer(d)}
                </Text>

                {d.feedback != null && (
                  <>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                      Feedback
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                      {d.feedback}
                    </Text>
                  </>
                )}

                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                    Score
                  </Text>
                  <Text style={[styles.scoreValue, { color: theme.colors.primary, fontSize: theme.typography.sizes.sm }]}>
                    {Number(d.score).toFixed(1)} / {d.point ?? d.points}
                  </Text>
                </View>
              </View>
            ))}
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
  detailCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailTitle: {
    fontWeight: '600',
  },
  correctnessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  correctnessText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailMeta: {
    marginBottom: 8,
  },
  detailLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 6,
    marginBottom: 2,
  },
  detailValue: {
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 24,
  },
  button: {
  },
});
