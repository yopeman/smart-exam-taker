import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useExamStore } from '../../store/examStore';
import { useAttemptStore } from '../../store/attemptStore';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { fetchExamByCode, isLoading: examsLoading } = useExamStore();
  const { fetchMyAttempts, syncOfflineData, setOfflineStatus } = useAttemptStore();
  const { isOnline } = useOnlineStatus();
  const [examCode, setExamCode] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    setOfflineStatus(!isOnline);
  }, [isOnline, setOfflineStatus]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyAttempts();
    }
  }, [isAuthenticated, fetchMyAttempts]);

  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline, syncOfflineData]);

  const handleTakeExam = async () => {
    const code = examCode.trim();
    if (!code) {
      setCodeError('Please enter an exam code');
      return;
    }
    setCodeError('');
    const exam = await fetchExamByCode(code);
    if (exam) {
      navigate(`/exams/${exam.id}`);
    } else {
      setCodeError(useExamStore.getState().error || 'Exam not found or not available');
    }
  };

  return (
    <StudentLayout>
      <div className="dashboard-header">
        <p className="dashboard-header__greeting">Welcome back,</p>
        <h1 className="dashboard-header__name">{user?.name}</h1>
        {!isOnline && <span className="offline-pill" style={{ marginTop: 8 }}>Offline Mode</span>}
      </div>

      <Card variant="elevated" style={{ marginBottom: 16 }}>
        <h2 className="action-card__title">Take an Exam</h2>
        <p className="action-card__subtitle" style={{ marginBottom: 12 }}>
          Enter your exam code to get started
        </p>
        <Input
          label="Exam Code"
          value={examCode}
          onChange={setExamCode}
          error={codeError}
          placeholder="e.g. EXAM0001"
        />
        <Button
          title={examsLoading ? 'Checking...' : 'Start Exam'}
          onPress={handleTakeExam}
          loading={examsLoading}
        />
      </Card>

      <button className="action-card" onClick={() => navigate('/attempts')}>
        <h3 className="action-card__title">My Attempts</h3>
        <p className="action-card__subtitle">View your exam history</p>
      </button>

      <button className="action-card" onClick={() => navigate('/profile')}>
        <h3 className="action-card__title">Profile Settings</h3>
        <p className="action-card__subtitle">Manage your account</p>
      </button>
    </StudentLayout>
  );
}