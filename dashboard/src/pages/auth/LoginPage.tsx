import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, Input, Button } from '../../components/ui';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setIsLoading(true);
      const res = await authService.login(email, password);
      login(res.token, res.professor);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="auth-card">
      <div className="auth-card-header">
        <h2>Welcome back</h2>
        <p>Log in to manage your CodeTrack sessions.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="professor@university.edu"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <Button type="submit" className="auth-submit-btn" isLoading={isLoading}>
          Log In
        </Button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </Card>
  );
};
