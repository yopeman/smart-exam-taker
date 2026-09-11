import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import { StudentLayout } from '../../components/layout/StudentLayout';

export default function Exams() {
  const navigate = useNavigate();
  const { availableExams, fetchAvailableExams, isLoading, error } = useExamStore();

  useEffect(() => {
    fetchAvailableExams();
  }, [fetchAvailableExams]);

  const available = availableExams.filter((e) => e.is_available && !e.has_attempted);

  return (
    <StudentLayout title="Available Exams" subtitle={`${available.length} exams available`}>
      {isLoading ? (
        <div className="center">
          <p className="center__text">Loading exams...</p>
        </div>
      ) : error ? (
        <div className="center">
          <p style={{ color: 'var(--color-error)' }}>{error}</p>
        </div>
      ) : available.length === 0 ? (
        <div className="empty-state">No exams available at the moment</div>
      ) : (
        available.map((exam) => (
          <button key={exam.id} className="exam-card card card--elevated" onClick={() => navigate(`/exams/${exam.id}`)}>
            <h3 className="exam-card__title">{exam.title}</h3>
            {exam.description && <p className="exam-card__description">{exam.description}</p>}
            <div className="exam-card__meta">
              <span>{exam.duration_minutes} min</span>
              {exam.department && <span>• {exam.department}</span>}
              {exam.year_of_study && <span>• Year {exam.year_of_study}</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span className="badge" style={{ backgroundColor: 'var(--color-success)' }}>
                Available
              </span>
            </div>
          </button>
        ))
      )}
    </StudentLayout>
  );
}