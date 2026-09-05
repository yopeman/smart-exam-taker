import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import type { Attempt } from '../api/attempts';

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function flattenExamQuestions(exam: any) {
  const map: Record<string, any> = {};
  (exam?.questions?.questions || []).forEach((group: any) => {
    (group.questions || []).forEach((q: any) => {
      map[q.id] = q;
    });
  });
  return map;
}

function questionText(q: any): string {
  if (!q) return '';
  const inner = q.question || q;
  return inner?.question || q.id || '';
}

function correctAnswerText(q: any): string {
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

function studentAnswerText(d: any): string {
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

export function buildAttemptHtml(attempt: Attempt): string {
  const exam = attempt.exam ?? null;
  const school = attempt.school ?? null;
  const accent = school?.primary_color || '#4f46e5';
  const details: any[] = Array.isArray(attempt.grading_details) ? attempt.grading_details : [];
  const questionMap = flattenExamQuestions(exam);
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
            <span class="detail-title">#${i + 1} ${escapeHtml(questionText(q) || d.question_id || `Q${i + 1}`)}</span>
            <span class="detail-badge" style="color:${correctnessColor(correctness)}">${correctnessLabel(correctness).toUpperCase()} · ${escapeHtml(point)} pts</span>
          </div>
          <div class="detail-row"><b>Question ID</b>${escapeHtml(q?.id || '—')}</div>
          <div class="detail-row"><b>Correct Answer</b>${escapeHtml(correctAnswerText(q))}</div>
          <div class="detail-row"><b>Student Answer</b>${escapeHtml(studentAnswerText(d))}</div>
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

export async function exportAttemptToPdf(attempt: Attempt): Promise<void> {
  if (Platform.OS === 'web') {
    Alert.alert('PDF export is only available on iOS and Android');
    return;
  }
  try {
    const { uri } = await Print.printToFileAsync({ html: buildAttemptHtml(attempt) });
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
  }
}