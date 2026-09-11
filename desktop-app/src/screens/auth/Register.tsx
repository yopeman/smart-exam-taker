import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const onSubmit = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();

    let hasError = false;
    if (!name) {
      setNameError('Name is required');
      hasError = true;
    }
    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    }
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
      await register({ email, password, name, role: 'student' });
      navigate('/login');
    } catch {
      // handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen" style={{ backgroundColor: theme.colors.background }}>
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-card__header">
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Sign up as a student</p>
        </div>

        <Input label="Full Name" placeholder="Enter your full name" value={name} onChange={setName} error={nameError} />
        <Input label="Email" placeholder="Enter your email" value={email} onChange={setEmail} error={emailError} autoCapitalize="none" />
        <Input label="Password" placeholder="Create a password" secureTextEntry value={password} onChange={setPassword} error={passwordError} />
        <Input label="Confirm Password" placeholder="Confirm your password" secureTextEntry value={confirmPassword} onChange={setConfirmPassword} error={confirmPasswordError} />

        {error ? (
          <p style={{ color: theme.colors.error, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </p>
        ) : null}

        <Button
          title="Sign Up"
          onPress={onSubmit}
          loading={isSubmitting || isLoading}
          style={{ marginTop: 16 }}
        />

        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <a onClick={() => navigate('/login')}>Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
}