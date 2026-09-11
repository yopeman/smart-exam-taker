import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authApi } from '../../lib/api/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    setEmailError('');
    setError('');
    setSuccess(false);

    if (!email) {
      setEmailError('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
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
              <h1 className="auth-card__title">Check Your Email</h1>
              <p className="auth-card__subtitle">
                We've sent a password reset link to your email
              </p>
            </div>
            <Button title="Back to Login" onPress={() => navigate('/login')} />
          </>
        ) : (
          <>
            <div className="auth-card__header">
              <h1 className="auth-card__title">Forgot Password</h1>
              <p className="auth-card__subtitle">Enter your email to reset your password</p>
            </div>

            <Input label="Email" placeholder="Enter your email" value={email} onChange={setEmail} error={emailError} autoCapitalize="none" />

            {error ? (
              <p style={{ color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
                {error}
              </p>
            ) : null}

            <Button title="Send Reset Link" onPress={onSubmit} loading={isSubmitting} />

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