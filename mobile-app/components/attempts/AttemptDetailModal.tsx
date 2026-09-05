import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useAttemptStore } from '../../store/attemptStore';
import { useTheme } from '../../lib/theme/theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface AttemptDetailModalProps {
  visible: boolean;
  attemptId: string | null;
  onClose: () => void;
}

export default function AttemptDetailModal({
  visible,
  attemptId,
  onClose,
}: AttemptDetailModalProps) {
  const { currentAttempt, fetchAttemptById, isLoading } = useAttemptStore();
  const { theme } = useTheme();

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

  const getCorrectnessText = (correctness: string) => {
    if (correctness === 'correct') return 'Correct';
    if (correctness === 'partial') return 'Partial';
    return 'Incorrect';
  };

  const flattenExamQuestions = (exam: any) => {
    const map: Record<string, any> = {};
    (exam?.questions?.questions || []).forEach((group: any) => {
      (group.questions || []).forEach((q: any) => {
        map[q.id] = q;
      });
    });
    return map;
  };

  const questionMap = useMemo(
    () => flattenExamQuestions(currentAttempt?.exam),
    [currentAttempt?.exam]
  );

  const renderCorrectAnswer = (q: any) => {
    if (!q) return '—';
    const inner = q.question || q;
    switch (inner.type) {
      case 'mcq': {
        const letter = inner.correct_answer;
        const option = (inner.options || []).find(
          (o: any) => o.letter === letter
        )?.option;
        return option ? `${letter} — ${option}` : String(letter ?? '—');
      }
      case 'true_false':
        return inner.correct_answer ? 'True' : 'False';
      case 'matching':
        return Object.entries(inner.correct_mapping || {})
          .map(([l, r]) => `${l}→${r}`)
          .join(', ');
      case 'blank_space':
        return Array.isArray(inner.correct_answers)
          ? inner.correct_answers.join(', ')
          : String(inner.correct_answers ?? '—');
      case 'short_answer':
      case 'essay':
        return String(inner.correct_answer ?? '—');
      default:
        return String(inner.correct_answer ?? inner.correct_answers ?? '—');
    }
  };

  const questionText = (q: any) => {
    if (!q) return '';
    const inner = q.question || q;
    return inner?.question || q.id || '';
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

  const gradingDetails: any[] = Array.isArray(currentAttempt?.grading_details)
    ? currentAttempt.grading_details
    : [];

  const school = currentAttempt?.school ?? null;
  const exam = currentAttempt?.exam ?? null;
  const primaryColor = school?.primary_color || theme.colors.primary;

  if (isLoading) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
            Loading attempt...
          </Text>
        </View>
      </Modal>
    );
  }

  if (!currentAttempt) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.md }]}>
              Attempt not found
            </Text>
            <Button
              title="Close"
              onPress={onClose}
              style={styles.backButton}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
                Attempt Details
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

        <Card
          style={{ ...styles.schoolCard, borderLeftColor: school?.primary_color || theme.colors.border }}
        >
          <View style={styles.schoolRow}>
            {school?.logo_url ? (
              <Image
                source={{ uri: school.logo_url }}
                style={[
                  styles.schoolLogo,
                  school?.primary_color ? { borderColor: school.primary_color } : null,
                ]}
                resizeMode="contain"
              />
            ) : school?.name ? (
              <View
                style={[
                  styles.schoolAvatar,
                  { backgroundColor: primaryColor },
                ]}
              >
                <Text style={[styles.schoolAvatarText, { fontSize: theme.typography.sizes.lg }]}>
                  {school.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={[styles.schoolAvatar, { backgroundColor: primaryColor }]}>
                <Text style={[styles.schoolAvatarText, { fontSize: theme.typography.sizes.lg }]}>
                  S
                </Text>
              </View>
            )}
            <View style={styles.schoolInfo}>
              {school?.name && (
                <Text style={[styles.schoolName, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                  {school.name}
                </Text>
              )}
              {school?.location && (
                <Text style={[styles.schoolLocation, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                  {school.location}
                </Text>
              )}
              <Text style={[styles.examTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                {exam?.title || 'Unknown exam'}{' '}
                {exam?.code && (
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }}>
                    ({exam.code})
                  </Text>
                )}
              </Text>
            </View>
          </View>
        </Card>

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

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              School
            </Text>
            <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              {school?.name || '—'}
            </Text>
          </View>

          {currentAttempt.year_of_study && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                Year / Semester / Section
              </Text>
              <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                {currentAttempt.year_of_study} / {currentAttempt.semester || '—'} /{' '}
                {currentAttempt.section || '—'}
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
              Answers & Grading
            </Text>
            {gradingDetails.map((d: any, i: number) => {
              const q = questionMap[d.question_id];
              return (
                <View
                  key={i}
                  style={[
                    styles.detailCard,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <View style={styles.detailHeader}>
                    <Text style={[styles.detailTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                      {questionText(q) || d.question_id || `Q${i + 1}`}
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
                          {getCorrectnessText(d.correctness)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.detailMeta, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                    {d.type} · {d.point ?? d.points} pts
                  </Text>
                  {q?.id && (
                    <Text style={[styles.detailMeta, { color: theme.colors.textLight, fontSize: theme.typography.sizes.xs }]}>
                      {q.id}
                    </Text>
                  )}

                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                    Correct Answer
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: theme.typography.sizes.sm }]}>
                    {renderCorrectAnswer(q)}
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
                      {Number(d.score ?? 0).toFixed(1)} / {d.point ?? d.points}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Close"
            onPress={onClose}
            variant="outline"
            style={styles.button}
          />
        </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '88%',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 0,
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
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    fontWeight: '600',
  },
  schoolCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  schoolAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  schoolInfo: {
    flex: 1,
    marginLeft: 12,
  },
  schoolName: {
    fontWeight: '600',
  },
  schoolLocation: {
    marginTop: 2,
  },
  examTitle: {
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    marginBottom: 12,
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
    maxWidth: '70%',
    textAlign: 'right',
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
    flex: 1,
    marginRight: 8,
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