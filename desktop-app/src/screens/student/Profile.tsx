import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../lib/theme/theme';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { authApi } from '../../lib/api/auth';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setThemeMode, setTextScale } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({ current: '', new: '', confirm: '' });
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleUpdateProfile = async () => {
    setNameError('');
    setPasswordErrors({ current: '', new: '', confirm: '' });
    setNotice(null);

    if (!name) {
      setNameError('Name is required');
      return;
    }

    const wantsPasswordChange = currentPassword || newPassword || confirmPassword;
    if (wantsPasswordChange) {
      let hasError = false;
      if (!currentPassword) {
        setPasswordErrors((prev) => ({ ...prev, current: 'Current password is required' }));
        hasError = true;
      }
      if (!newPassword) {
        setPasswordErrors((prev) => ({ ...prev, new: 'New password is required' }));
        hasError = true;
      } else if (newPassword.length < 8) {
        setPasswordErrors((prev) => ({ ...prev, new: 'Password must be at least 8 characters' }));
        hasError = true;
      }
      if (newPassword !== confirmPassword) {
        setPasswordErrors((prev) => ({ ...prev, confirm: 'Passwords do not match' }));
        hasError = true;
      }
      if (hasError) return;
    }

    setIsSubmitting(true);
    try {
      await authApi.updateProfile({ name });
      if (wantsPasswordChange) {
        await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      }
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice({
        type: 'success',
        message: wantsPasswordChange
          ? 'Profile and password updated successfully'
          : 'Profile updated successfully',
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update profile' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteModalOpen(false);
    try {
      await authApi.deleteAccount();
      await logout();
      navigate('/login');
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to delete account' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <StudentLayout>
      {notice && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 16,
            backgroundColor:
              notice.type === 'success' ? theme.colors.success + '22' : theme.colors.error + '22',
            color: notice.type === 'success' ? theme.colors.success : theme.colors.error,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {notice.message}
        </div>
      )}

      <Card>
        <div className="info-row">
          <span className="info-row__label">Email</span>
          <span className="info-row__value">{user?.email}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Role</span>
          <span className="info-row__value">{user?.role}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Verified</span>
          <span className="info-row__value" style={{ color: user?.is_verified ? theme.colors.success : theme.colors.warning }}>
            {user?.is_verified ? 'Yes' : 'No'}
          </span>
        </div>
      </Card>

      <Card>
        <h3 className="section-title">Personal Information</h3>

        {isEditing ? (
          <>
            <Input label="Full Name" value={name} onChange={setName} error={nameError} />
            <Input label="Current Password" value={currentPassword} onChange={setCurrentPassword} secureTextEntry error={passwordErrors.current} />
            <Input label="New Password" value={newPassword} onChange={setNewPassword} secureTextEntry error={passwordErrors.new} />
            <Input label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} secureTextEntry error={passwordErrors.confirm} />
            <div className="button-row">
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setIsEditing(false);
                  setName(user?.name || '');
                  setNameError('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordErrors({ current: '', new: '', confirm: '' });
                }}
              />
              <Button title="Save" onPress={handleUpdateProfile} loading={isSubmitting} />
            </div>
          </>
        ) : (
          <>
            <div className="info-row">
              <span className="info-row__label">Name</span>
              <span className="info-row__value">{user?.name}</span>
            </div>
            <div className="button-row">
              <Button title="Edit Profile" variant="outline" onPress={() => setIsEditing(true)} />
            </div>
          </>
        )}
      </Card>

      <Card>
        <h3 className="section-title">Appearance</h3>
        <div className="info-row">
          <span className="info-row__label">Theme</span>
        </div>
        <div className="button-row">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <Button
              key={mode}
              title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              onPress={() => setThemeMode(mode)}
              variant={theme.mode === mode ? 'primary' : 'outline'}
              size="small"
            />
          ))}
        </div>
        <div className="info-row mt-16">
          <span className="info-row__label">Text Size</span>
        </div>
        <div className="button-row">
          {([0.8, 1.0, 1.2] as const).map((scale) => (
            <Button
              key={scale}
              title={`${scale}x`}
              onPress={() => setTextScale(scale)}
              variant={theme.typography.scale === scale ? 'primary' : 'outline'}
              size="small"
            />
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="section-title">Account Actions</h3>
        <div className="button-row">
          <Button title="Logout" variant="outline" onPress={handleLogout} />
        </div>
        <div className="button-row">
          <Button title="Delete Account" variant="danger" onPress={() => setDeleteModalOpen(true)} />
        </div>
      </Card>

      <Modal visible={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account">
        <p className="text-secondary" style={{ marginBottom: 16 }}>
          Are you sure you want to delete your account? This action cannot be undone.
        </p>
        <div className="button-row">
          <Button title="Cancel" variant="outline" onPress={() => setDeleteModalOpen(false)} />
          <Button title="Delete" variant="danger" onPress={handleDeleteAccount} />
        </div>
      </Modal>
    </StudentLayout>
  );
}