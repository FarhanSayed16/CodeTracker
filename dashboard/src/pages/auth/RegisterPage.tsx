import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, Input, Button } from '../../components/ui';
import './AuthPages.css';

type StrengthLevel = 'weak' | 'medium' | 'strong' | '';

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return '';

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApi<any[]>('/departments')
      .then(setDepartments)
      .catch(console.error);
  }, []);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;
  const canSubmit =
    !!name &&
    !!email &&
    passwordLongEnough &&
    passwordsMatch &&
    confirmPassword.length > 0 &&
    !isLoading;

  const confirmError =
    touchedConfirm && confirmPassword.length > 0 && !passwordsMatch
      ? 'Passwords do not match'
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetchApi<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, departmentId: departmentId || undefined })
      });
      login(res.token, res.professor);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="auth-card">
      <div className="auth-card-header">
        <h2>Create an account</h2>
        <p>Get started with CodeTrack today.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dr. Alan Turing"
          required
        />
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="professor@university.edu"
          required
        />
        <div>
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
          />
          {password && (
            <div className="password-strength" data-strength={strength}>
              <div className="password-strength-bar">
                <span className="password-strength-fill" />
              </div>
              <span className="password-strength-label">
                {strength === 'weak' && 'Weak'}
                {strength === 'medium' && 'Medium'}
                {strength === 'strong' && 'Strong'}
              </span>
            </div>
          )}
        </div>
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setTouchedConfirm(true)}
          placeholder="Re-enter your password"
          error={confirmError}
          required
        />
        <div className="input-group">
          <label className="input-label">Department (Optional)</label>
          <select
            className="input-field"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">Select a Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.institution?.name})</option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          className="auth-submit-btn"
          isLoading={isLoading}
          disabled={!canSubmit}
        >
          Create Account
        </Button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </Card>
  );
};
