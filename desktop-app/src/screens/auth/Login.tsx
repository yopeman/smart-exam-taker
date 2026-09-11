import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const onSubmit = async () => {
    setEmailError('');
    setPasswordError('');
    clearError();

    let hasError = false;
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch {
      // handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen" style={{ backgroundColor: theme.colors.background }}>
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Smart Exam Taker</h1>
          <p className="auth-card__subtitle">Sign in to take your exams</p>
        </div>

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
          error={emailError}
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChange={setPassword}
          error={passwordError}
        />

        {error ? (
          <p style={{ color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </p>
        ) : null}

        <Button
          title="Sign In"
          onPress={onSubmit}
          loading={isSubmitting || isLoading}
          style={{ marginTop: 16 }}
        />

        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <a onClick={() => navigate('/register')}>Sign Up</a>
          </p>
          <p>
            <a onClick={() => navigate('/forgot-password')}>Forgot Password?</a>
          </p>
        </div>
      </div>
    </div>
  );
}