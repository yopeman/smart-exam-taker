import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { attemptsApi, Attempt } from '../../lib/api/attempts';

interface AttemptDetailModalProps {
  visible: boolean;
  attemptId: string | null;
  onClose: () => void;
}

export const AttemptDetailModal: React.FC<AttemptDetailModalProps> = ({
  visible,
  attemptId,
  onClose,
}) => {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !attemptId) {
      setAttempt(null);
      return;
    }
    setLoading(true);
    setError(null);
    attemptsApi
      .getAttemptById(attemptId)
      .then((a) => setAttempt(a))
      .catch((err: any) => setError(err.message || 'Failed to load attempt'))
      .finally(() => setLoading(false));
  }, [visible, attemptId]);

  const exam = attempt?.exam ?? null;

  return (
    <Modal visible={visible} onClose={onClose} title="Attempt Details" wide>
      {loading ? (
        <div className="center">
          <p className="center__text">Loading attempt...</p>
        </div>
      ) : error ? (
        <div className="center">
          <p style={{ color: 'var(--color-error)' }}>{error}</p>
        </div>
      ) : attempt ? (
        <div>
          {exam && (
            <>
              <h3 className="section-title">{exam.title}</h3>
              <p className="text-secondary" style={{ marginBottom: 16 }}>
                {exam.code}
              </p>
            </>
          )}

          <div className="info-row">
            <span className="info-row__label">Student</span>
            <span className="info-row__value">
              {attempt.student_first_name} {attempt.student_last_name}
            </span>
          </div>
          <div className="info-row">
            <span className="info-row__label">Student ID</span>
            <span className="info-row__value">{attempt.student_id_number}</span>
          </div>
          {attempt.department && (
            <div className="info-row">
              <span className="info-row__label">Department</span>
              <span className="info-row__value">{attempt.department}</span>
            </div>
          )}
          {attempt.section && (
            <div className="info-row">
              <span className="info-row__label">Section</span>
              <span className="info-row__value">{attempt.section}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-row__label">Status</span>
            <span className="info-row__value">{attempt.status}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">Started</span>
            <span className="info-row__value">{new Date(attempt.started_at).toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="info-row__label">Submitted</span>
            <span className="info-row__value">
              {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}
            </span>
          </div>

          <div className="divider" />

          {(attempt.objective_score !== null || attempt.ai_score !== null || attempt.total_score !== null) && (
            <>
              <h3 className="section-title">Score</h3>
              <div className="info-row">
                <span className="info-row__label">Objective</span>
                <span className="info-row__value">{attempt.objective_score ?? '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">AI Score</span>
                <span className="info-row__value">{attempt.ai_score ?? '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Total</span>
                <span className="info-row__value" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {attempt.total_score ?? '-'}
                </span>
              </div>
            </>
          )}

          {attempt.answers?.attempts?.length > 0 && (
            <>
              <div className="divider" />
              <h3 className="section-title">Answers</h3>
              {attempt.answers.attempts.map((item: any, idx: number) => {
                let rendered: string;
                const value = item.attempt;
                if (value === null || value === undefined) {
                  rendered = '(no answer)';
                } else if (typeof value === 'object') {
                  rendered = JSON.stringify(value, null, 2);
                } else {
                  rendered = String(value);
                }
                return (
                  <div key={idx} style={{ marginBottom: 12, padding: 12, borderRadius: 8, backgroundColor: 'var(--color-surface-variant)' }}>
                    <div className="meta-block__label">{item.question_id}</div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, marginTop: 4 }}>{rendered}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
};