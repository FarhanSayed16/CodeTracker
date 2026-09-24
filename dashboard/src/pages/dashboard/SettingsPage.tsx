import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Card } from '../../components/ui';

export const SettingsPage: React.FC = () => {
  const { professor, login } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof authService.getMe>> | null>(null);
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    authService
      .getMe()
      .then((data) => {
        setProfile(data);
        setName(data.name || '');
      })
      .catch(console.error);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    try {
      setSavingProfile(true);
      const updated = await authService.updateProfile(name.trim());
      setProfile(updated);
      const token = localStorage.getItem('token');
      if (token) {
        login(token, { id: updated.id, name: updated.name, email: updated.email });
      }
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setSavingPassword(true);
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 720, margin: '0 auto' }}>
      <header className="page-header mb-6" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Update your profile and password.</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 16 }}>Profile</h2>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" value={profile?.email || professor?.email || ''} disabled />
            <div>
              <label className="input-label">Department</label>
              <div
                style={{
                  marginTop: 4,
                  padding: '10px 12px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {profile?.department
                  ? `${profile.department.name} (${profile.department.institution?.name})`
                  : 'No department assigned'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" isLoading={savingProfile}>
                Save profile
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 16 }}>Change password</h2>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" isLoading={savingPassword}>
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
