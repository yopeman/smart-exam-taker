import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';

interface StudentLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  title,
  subtitle,
  actions,
  children,
  wide,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar__brand">Smart Exam Taker</div>
        <div className="topbar__actions">
          <Button
            title="Dashboard"
            variant={isActive('/dashboard') ? 'primary' : 'outline'}
            size="small"
            onPress={() => navigate('/dashboard')}
          />
          <Button
            title="Exams"
            variant={isActive('/exams') ? 'primary' : 'outline'}
            size="small"
            onPress={() => navigate('/exams')}
          />
          <Button
            title="Attempts"
            variant={isActive('/attempts') ? 'primary' : 'outline'}
            size="small"
            onPress={() => navigate('/attempts')}
          />
          <Button
            title="Profile"
            variant={isActive('/profile') ? 'primary' : 'outline'}
            size="small"
            onPress={() => navigate('/profile')}
          />
          <span className="topbar__user">{user?.name}</span>
        </div>
      </div>

      <div className="page">
        <div className={wide ? 'page__inner page__inner--wide' : 'page__inner'}>
          {(title || actions) && (
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}
            >
              <div>
                {title ? <h1 className="page__title">{title}</h1> : null}
                {subtitle ? <p className="page__subtitle">{subtitle}</p> : null}
              </div>
              {actions ? <div>{actions}</div> : null}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};