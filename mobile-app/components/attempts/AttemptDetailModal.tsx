import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAttemptStore } from '../../store/attemptStore';
import { useTheme } from '../../lib/theme/theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface AttemptDetailModalProps {
  visible: boolean;
  attemptId: string | null;
  onClose: () => void;
}

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function flattenExamQuestionsPdf(exam: any) {
  const map: Record<string, any> = {};
  (exam?.questions?.questions || []).forEach((group: any) => {
    (group.questions || []).forEach((q: any) => {
      map[q.id] = q;
    });
  });
  return map;
}

function questionTextPdf(q: any): string {
  if (!q) return '';
  const inner = q.question || q;
  return inner?.question || q.id || '';
}

function correctAnswerTextPdf(q: any): string {
  if (!q) return 'Unknown';
  const inner = q.question || q;
  switch (inner.type) {
    case 'mcq': {
      const letter = inner.correct_answer;
      const option = (inner.options || []).find((o: any) => o.letter === letter)?.option;
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
}

function studentAnswerTextPdf(d: any): string {
  const { type, answer } = d;
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
}

function buildAttemptHtml(attempt: any): string {
  const exam = attempt.exam ?? null;
  const school = attempt.school ?? null;
  const accent = school?.primary_color || '#4f46e5';
  const details: any[] = Array.isArray(attempt.grading_details) ? attempt.grading_details : [];
  const questionMap = flattenExamQuestionsPdf(exam);
  const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleString() : '—');
  const correctnessColor = (c: string) =>
    c === 'correct' ? '#16a34a' : c === 'partial' ? '#d97706' : '#dc2626';
  const correctnessLabel = (c: string) =>
    c === 'correct' ? 'Correct' : c === 'partial' ? 'Partial' : 'Incorrect';

  let schoolHtml = '';
  if (school?.name || exam?.title) {
    schoolHtml = `<div class="school" style="border-left-color:${accent}">`;
    if (school?.logo_url) {
      schoolHtml += `<img src="${escapeHtml(school.logo_url)}" alt="School logo"/>`;
    }
    schoolHtml += '<div>';
    if (school?.name) {
      schoolHtml += `<div class="school-name" style="color:${accent}">${escapeHtml(school.name)}</div>`;
    }
    if (school?.location) {
      schoolHtml += `<div class="school-loc">${escapeHtml(school.location)}</div>`;
    }
    schoolHtml += `<div class="exam-title">${escapeHtml(exam?.title || 'Unknown exam')} ${exam?.code ? `<span class="exam-code">(${escapeHtml(exam.code)})</span>` : ''}</div>`;
    schoolHtml += '</div></div>';
  }

  let faceHtml = '';
  if (attempt.student_face_url) {
    faceHtml = '<div class="face"><div class="section-label">Captured Face</div>';
    faceHtml += `<img src="${escapeHtml(attempt.student_face_url)}" alt="Captured face"/>`;
    faceHtml += `<div class="face-cap">Captured: ${escapeHtml(fmtDate(attempt.face_captured_at))}</div></div>`;
  }

  const grid: Array<[string, any]> = [
    ['Student', `${attempt.student_first_name} ${attempt.student_last_name}`.trim() || '—'],
    ['ID Number', attempt.student_id_number || '—'],
    ['Department', attempt.department || '—'],
    ['School', school?.name || '—'],
    [
      'Year / Semester / Section',
      `${attempt.year_of_study ?? '—'} / ${attempt.semester || '—'} / ${attempt.section || '—'}`,
    ],
    ['Status', attempt.status || '—'],
  ];
  let gridHtml = '';
  for (let r = 0; r < grid.length; r += 2) {
    const left = grid[r];
    const right = grid[r + 1];
    gridHtml += `<tr>
      <th>${escapeHtml(left[0])}</th><td>${escapeHtml(left[1])}</td>
      <th>${escapeHtml(right ? right[0] : '')}</th><td>${escapeHtml(right ? right[1] : '')}</td>
    </tr>`;
  }

  const scoreCols = (
    [
      ['Objective', attempt.objective_score],
      ['AI', attempt.ai_score],
      ['Total', attempt.total_score],
    ] as Array<[string, any]>
  ).filter(([, v]) => v !== null);
  const scoreHtml =
    '<table class="score-cols"><tr>' +
    scoreCols.map(([l]) => `<th>${escapeHtml(l)}</th>`).join('') +
    '</tr><tr>' +
    scoreCols.map(([, v]) => `<td>${escapeHtml(v ?? '—')}</td>`).join('') +
    '</tr></table>';

  const timeline: Array<[string, any]> = [
    ['Started', fmtDate(attempt.started_at)],
    ['Submitted', fmtDate(attempt.submitted_at)],
    ['Graded', fmtDate(attempt.graded_at)],
  ];
  let timelineHtml = '';
  timeline.forEach(([l, v]) => {
    timelineHtml += `<tr><th>${escapeHtml(l)}</th><td>${escapeHtml(v)}</td><th></th><td></td></tr>`;
  });

  let answersHtml = '';
  if (details.length > 0) {
    details.forEach((d, i) => {
      const q = questionMap[d.question_id];
      const correctness = d.correctness || 'incorrect';
      const point = d.point ?? d.points;
      answersHtml += `
        <div class="detail">
          <div class="detail-head">
            <span class="detail-title">#${i + 1} ${escapeHtml(questionTextPdf(q) || d.question_id || `Q${i + 1}`)}</span>
            <span class="detail-badge" style="color:${correctnessColor(correctness)}">${correctnessLabel(correctness).toUpperCase()} · ${escapeHtml(point)} pts</span>
          </div>
          <div class="detail-row"><b>Question ID</b>${escapeHtml(q?.id || '—')}</div>
          <div class="detail-row"><b>Correct Answer</b>${escapeHtml(correctAnswerTextPdf(q))}</div>
          <div class="detail-row"><b>Student Answer</b>${escapeHtml(studentAnswerTextPdf(d))}</div>
          <div class="detail-row"><b>Feedback</b>${escapeHtml(d.feedback != null ? d.feedback : '—')}</div>
          <div class="score-row"><span>Score</span><span>${Number(d.score ?? 0).toFixed(1)} / ${escapeHtml(point)}</span></div>
        </div>`;
    });
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body{font-family:Helvetica,Arial,sans-serif;color:#111827;font-size:13px;margin:18px;}
  h1{font-size:18px;margin:0 0 14px;}
  .school{display:flex;align-items:center;gap:12px;border-left:5px solid #4f46e5;padding:10px 12px;background:#f9fafb;border-radius:8px;}
  .school img{width:88px;height:88px;object-fit:contain;border:1px solid #e5e7eb;border-radius:8px;background:#fff;}
  .school-name{font-size:16px;font-weight:700;}
  .school-loc{font-size:11px;color:#6b7280;margin-top:2px;}
  .exam-title{font-size:13px;font-weight:600;margin-top:4px;}
  .exam-code{color:#6b7280;font-size:11px;font-weight:400;}
  .section-label{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;font-weight:700;margin-top:16px;margin-bottom:4px;}
  .face img{width:110px;height:110px;object-fit:cover;border:1px solid #e5e7eb;border-radius:8px;}
  .face-cap{color:#6b7280;font-size:11px;margin-top:4px;}
  .grid{width:100%;border-collapse:collapse;margin-top:8px;}
  .grid th,.grid td{border:1px solid #e5e7eb;padding:6px 8px;text-align:left;vertical-align:top;font-size:12px;}
  .grid th{background:#f9fafb;color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:.4px;width:28%;}
  .score-cols{width:100%;border-collapse:collapse;margin-top:8px;text-align:center;}
  .score-cols th{background:${accent};color:#fff;padding:6px;font-size:11px;border:1px solid #e5e7eb;}
  .score-cols td{padding:8px;font-size:16px;font-weight:700;border:1px solid #e5e7eb;}
  .detail{border:1px solid #e5e7eb;border-radius:8px;margin-top:12px;overflow:hidden;}
  .detail-head{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;}
  .detail-title{font-weight:700;font-size:12px;flex:1;}
  .detail-badge{font-size:10px;font-weight:700;white-space:nowrap;margin-left:8px;}
  .detail-row{border-top:1px solid #e5e7eb;padding:6px 10px;font-size:12px;}
  .detail-row b{color:#6b7280;font-size:10px;text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:2px;}
  .score-row{display:flex;justify-content:space-between;padding:8px 10px;border-top:1px solid #e5e7eb;font-weight:600;}
  .footer{text-align:center;color:#9ca3af;font-size:10px;margin-top:20px;}
</style>
</head>
<body>
  <h1>Attempt Details</h1>
  ${schoolHtml}
  ${faceHtml}
  <div class="section-label">Student Information</div>
  <table class="grid">${gridHtml}</table>
  <div class="section-label">Scores</div>
  ${scoreHtml}
  <div class="section-label">Timeline</div>
  <table class="grid">${timelineHtml}</table>
  ${details.length > 0 ? '<div class="section-label">Answers &amp; Grading</div>' : ''}
  ${answersHtml}
  <div class="footer">Generated by Smart Exam Taker</div>
</body>
</html>`;
}

export default function AttemptDetailModal({
  visible,
  attemptId,
  onClose,
}: AttemptDetailModalProps) {
  const { currentAttempt, fetchAttemptById, isLoading } = useAttemptStore();
  const { theme } = useTheme();
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!currentAttempt) return;
    if (Platform.OS === 'web') {
      Alert.alert('PDF export is only available on iOS and Android');
      return;
    }
    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({
        html: buildAttemptHtml(currentAttempt),
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export attempt as PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF generated', uri);
      }
    } catch (err: any) {
      Alert.alert('Failed to generate PDF', err?.message || 'Something went wrong');
    } finally {
      setExporting(false);
    }
  };

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

        {currentAttempt.student_face_url && (
          <Card style={styles.card}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
              Captured Face
            </Text>
            <Image
              source={{ uri: currentAttempt.student_face_url }}
              style={[
                styles.faceImage,
                { borderColor: theme.colors.border },
              ]}
              resizeMode="cover"
            />
            {currentAttempt.face_captured_at && (
              <Text style={[styles.detailMeta, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs }]}>
                Captured: {new Date(currentAttempt.face_captured_at).toLocaleString()}
              </Text>
            )}
          </Card>
        )}

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
            title="Download PDF"
            onPress={handleExportPDF}
            loading={exporting}
            style={styles.button}
          />
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
  faceImage: {
    width: 112,
    height: 112,
    borderRadius: 8,
    borderWidth: 1,
    margin: 8,
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
    padding: 8,
    paddingTop: 4,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    flex: 1,
  },
});