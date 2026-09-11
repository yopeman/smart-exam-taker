import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../lib/api/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token') || '';

  const onSubmit = async () => {
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');
    setSuccess(false);

    let hasError = false;
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, new_password: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen" style={{ backgroundColor: theme.colors.background }}>
      <div className="auth-card">
        {success ? (
          <>
            <div className="auth-card__header">
              <h1 className="auth-card__title">Password Reset</h1>
              <p className="auth-card__subtitle">
                Your password has been successfully reset
              </p>
            </div>
            <Button title="Go to Login" onPress={() => navigate('/login')} />
          </>
        ) : (
          <>
            <div className="auth-card__header">
              <h1 className="auth-card__title">Reset Password</h1>
              <p className="auth-card__subtitle">Create a new password</p>
            </div>

            <Input label="New Password" placeholder="Enter your new password" secureTextEntry value={password} onChange={setPassword} error={passwordError} />
            <Input label="Confirm Password" placeholder="Confirm your new password" secureTextEntry value={confirmPassword} onChange={setConfirmPassword} error={confirmPasswordError} />

            {error ? (
              <p style={{ color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
                {error}
              </p>
            ) : null}

            <Button title="Reset Password" onPress={onSubmit} loading={isSubmitting} />

            <div className="auth-links">
              <p>
                <a onClick={() => navigate('/login')}>Back to Login</a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}