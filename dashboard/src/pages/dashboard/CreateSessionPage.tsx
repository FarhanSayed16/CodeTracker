import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { classService, type ClassItem } from '../../services/classService';
import { sessionService, type SessionItem } from '../../services/sessionService';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { Button, Card, Input, QRCodeModal } from '../../components/ui';
import { SessionCodeDisplay } from '../../components/SessionCodeDisplay';

export const CreateSessionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { socket, isConnected } = useSocket();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState(searchParams.get('classId') || '');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState<SessionItem | null>(null);
  const [joinCount, setJoinCount] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    classService.getClasses().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !session) return;
    socket.emit('join-session', session.id);
    const onJoined = () => setJoinCount((c) => c + 1);
    socket.on('student-joined', onJoined);
    return () => {
      socket.off('student-joined', onJoined);
    };
  }, [socket, isConnected, session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !title.trim()) {
      toast.error('Select a class and enter a session title');
      return;
    }
    try {
      setCreating(true);
      const created = await sessionService.createSession(classId, title.trim());
      setSession(created);
      setJoinCount(created._count?.participants || 0);
      toast.success(`Session created! Code: ${created.sessionCode}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  if (session) {
    return (
      <div className="page-container" style={{ maxWidth: 640, margin: '0 auto' }}>
        <header className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="page-title">Session ready</h1>
            <p className="page-subtitle">{session.title}</p>
          </div>
        </header>

        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Share this code with students</p>
          <SessionCodeDisplay code={session.sessionCode} />
          <p style={{ marginTop: 24, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Students joined: <strong>{joinCount}</strong>
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setQrOpen(true)}>
              <QrCode size={18} /> Show QR
            </Button>
            <Button onClick={() => navigate(`/sessions/${session.id}`)}>Open Session Dashboard →</Button>
          </div>
        </Card>

        <QRCodeModal isOpen={qrOpen} onClose={() => setQrOpen(false)} sessionId={session.id} />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 560, margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Create Session</h1>
          <p className="page-subtitle">Start a live monitoring session for a class.</p>
        </div>
      </header>

      <Card>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Class</label>
            <select
              className="input-field"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className} ({c._count?.enrollments || 0} students)
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Session title"
            placeholder="e.g. DOM Practical 05"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={creating}>
              Create Session & Get Code
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
