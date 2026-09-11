import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useExamStore } from '../../store/examStore';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

function getStatusColor(status: string): string {
  switch (status) {
    case 'started':
      return 'var(--color-warning)';
    case 'completed':
      return 'var(--color-success)';
    case 'cancelled':
      return 'var(--color-error)';
    default:
      return 'var(--color-info)';
  }
}

export default function ExamDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { examByCode: currentExam, fetchStudentExamById, isLoading, error } = useExamStore();

  useEffect(() => {
    if (id) {
      fetchStudentExamById(id);
    }
  }, [id, fetchStudentExamById]);

  const exam = currentExam;

  const handleBack = () => navigate(-1);

  return (
    <StudentLayout>
      {isLoading ? (
        <div className="center">
          <p className="center__text">Loading exam...</p>
        </div>
      ) : !exam ? (
        <div className="center">
          <p className="center__text">{error || 'Exam not found'}</p>
          <Button title="Go Back" onPress={handleBack} style={{ marginTop: 16 }} />
        </div>
      ) : (
        <>
          <div className="page__header">
            <h1 className="page__title">{exam.title}</h1>
            {exam.description && <p className="page__subtitle">{exam.description}</p>}
          </div>

          <Card>
            <div className="info-row">
              <span className="info-row__label">Duration</span>
              <span className="info-row__value">{exam.duration_minutes} minutes</span>
            </div>
            {exam.department && (
              <div className="info-row">
                <span className="info-row__label">Department</span>
                <span className="info-row__value">{exam.department}</span>
              </div>
            )}
            {exam.year_of_study && (
              <div className="info-row">
                <span className="info-row__label">Year of Study</span>
                <span className="info-row__value">{exam.year_of_study}</span>
              </div>
            )}
            {exam.semester && (
              <div className="info-row">
                <span className="info-row__label">Semester</span>
                <span className="info-row__value">{exam.semester}</span>
              </div>
            )}
            {exam.section && (
              <div className="info-row">
                <span className="info-row__label">Section</span>
                <span className="info-row__value">{exam.section}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-row__label">Status</span>
              <span className="status-badge" style={{ backgroundColor: getStatusColor(exam.status) + '33', color: getStatusColor(exam.status) }}>
                {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
              </span>
            </div>
          </Card>

          <Card>
            <h3 className="section-title">Instructions</h3>
            <p className="text-secondary" style={{ marginBottom: 8 }}>
              • Make sure you have a stable internet connection
            </p>
            <p className="text-secondary" style={{ marginBottom: 8 }}>
              • You will need to capture your face before starting
            </p>
            <p className="text-secondary" style={{ marginBottom: 8 }}>
              • The exam will be automatically submitted when time expires
            </p>
            <p className="text-secondary">• During the exam the app will run in fullscreen and leaving it counts as a security violation</p>
          </Card>

          <div className="button-row mt-24">
            <Button title="Start Exam" onPress={() => navigate(`/exams/${id}/take`)} />
            <Button title="Cancel" variant="outline" onPress={handleBack} />
          </div>
        </>
      )}
    </StudentLayout>
  );
}