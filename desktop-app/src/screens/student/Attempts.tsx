import { useEffect, useMemo, useState } from 'react';
import { useAttemptStore } from '../../store/attemptStore';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { AttemptDetailModal } from '../../components/attempts/AttemptDetailModal';
import { usePagination } from '../../hooks/usePagination';
import { buildAttemptPdfHtml } from '../../lib/utils/pdf';
import type { Attempt } from '../../lib/api/attempts';

const hasElectronAPI = () =>
  typeof window !== 'undefined' && !!(window as any).electronAPI;

function getStatusColor(status: string): string {
  switch (status) {
    case 'graded':
      return 'var(--color-success)';
    case 'submitted':
    case 'processing':
      return 'var(--color-warning)';
    case 'in_progress':
      return 'var(--color-info)';
    default:
      return 'var(--color-text-light)';
  }
}

function getStatusText(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export default function Attempts() {
  const { myAttempts, fetchMyAttempts, isLoading, error } = useAttemptStore();
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);

  const filteredAttempts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myAttempts;
    return myAttempts.filter((a) => {
      const exam = a.exam ?? null;
      const school = a.school ?? null;
      const haystack = [
        a.student_first_name,
        a.student_last_name,
        a.student_id_number,
        a.department,
        a.section,
        exam?.title,
        exam?.code,
        school?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [myAttempts, search]);

  const pagination = usePagination(filteredAttempts, 5);

  useEffect(() => {
    fetchMyAttempts();
  }, [fetchMyAttempts]);

  const handleExportDownload = async (attempt: Attempt) => {
    if (exportingId) return;
    setExportingId(attempt.id);
    try {
      const html = buildAttemptPdfHtml(attempt);
      const defaultName = `attempt-${attempt.student_id_number || attempt.id}.pdf`;
      if (hasElectronAPI()) {
        await (window as any).electronAPI.savePdfFromHtml(html, defaultName);
      } else {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportingId(null);
    }
  };

  return (
    <StudentLayout title="My Attempts" subtitle={`${myAttempts.length} attempts`} wide>
      <Input
        value={search}
        onChange={setSearch}
        placeholder="Search by name, ID, exam, school..."
        containerStyle={{ marginTop: 4 }}
      />

      {isLoading ? (
        <div className="center">
          <p className="center__text">Loading attempts...</p>
        </div>
      ) : error ? (
        <div className="center">
          <p style={{ color: 'var(--color-error)' }}>{error}</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="empty-state">
          {myAttempts.length === 0 ? 'No exam attempts yet' : 'No attempts match your search'}
        </div>
      ) : (
        pagination.paged.map((attempt) => {
          const school = attempt.school ?? null;
          const exam = attempt.exam ?? null;
          const primaryColor = school?.primary_color || 'var(--color-primary)';
          return (
            <Card
              key={attempt.id}
              variant="elevated"
              className="attempt-card"
              style={school?.primary_color ? { borderLeft: `4px solid ${school.primary_color}` } : undefined}
            >
              <div className="attempt-card__top">
                {school?.logo_url ? (
                  <img src={school.logo_url} alt="" className="school-logo" />
                ) : school?.name ? (
                  <div className="school-avatar" style={{ backgroundColor: primaryColor }}>
                    {school.name.charAt(0).toUpperCase()}
                  </div>
                ) : null}
                {school?.name && <span className="school-name">{school.name}</span>}
                <span className="status-badge" style={{ backgroundColor: getStatusColor(attempt.status) + '33', color: getStatusColor(attempt.status) }}>
                  {getStatusText(attempt.status)}
                </span>
                <button
                  type="button"
                  className="button button--outline button--small"
                  disabled={exportingId !== null}
                  onClick={() => handleExportDownload(attempt)}
                >
                  {exportingId === attempt.id ? 'Exporting...' : 'PDF'}
                </button>
                <button
                  type="button"
                  className="button button--primary button--small"
                  onClick={() => setSelectedAttemptId(attempt.id)}
                >
                  View
                </button>
              </div>

              <h3 className="attempt-card__exam-title" onClick={() => setSelectedAttemptId(attempt.id)}>
                {exam?.title || 'Unknown exam'}
              </h3>
              {exam?.code && <p className="attempt-card__exam-code">{exam.code}</p>}

              <div className="divider" />

              <div className="meta-block">
                <div className="meta-block__label">Student</div>
                <div className="meta-block__value">
                  {attempt.student_first_name} {attempt.student_last_name}
                </div>
              </div>
              <div className="meta-block">
                <div className="meta-block__label">Student ID</div>
                <div className="meta-block__value">{attempt.student_id_number}</div>
              </div>
              {attempt.department && (
                <div className="meta-block">
                  <div className="meta-block__label">Department</div>
                  <div className="meta-block__value">{attempt.department}</div>
                </div>
              )}

              {attempt.total_score !== null && (
                <div className="attempt-card__score">
                  <span className="attempt-card__score-label">Total Score</span>
                  <span className="attempt-card__score-value">{attempt.total_score}</span>
                </div>
              )}

              <div className="meta-block mt-16">
                <div className="meta-block__label">Submitted</div>
                <div className="meta-block__value">
                  {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'Not submitted'}
                </div>
              </div>
            </Card>
          );
        })
      )}

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      <AttemptDetailModal
        visible={!!selectedAttemptId}
        attemptId={selectedAttemptId}
        onClose={() => setSelectedAttemptId(null)}
      />
    </StudentLayout>
  );
}