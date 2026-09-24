import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Plus, BookOpen, Users, Activity, Calendar, Layers, Radio } from 'lucide-react';
import { Card, Button, Skeleton, EmptyState, Badge } from '../../components/ui';
import { useClasses } from '../../hooks/useClasses';
import { useAuth } from '../../context/AuthContext';
import { sessionService, type SessionItem } from '../../services/sessionService';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { professor } = useAuth();
  const { classes, isLoading, fetchClasses } = useClasses();
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    sessionService
      .getAllSessions('ACTIVE')
      .then(setActiveSessions)
      .catch(console.error)
      .finally(() => setSessionsLoading(false));
  }, []);

  const totalStudents = classes.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);
  const totalSessions = classes.reduce((sum, c) => sum + (c._count?.sessions || 0), 0);
  const recentClasses = classes.slice(0, 3);

  return (
    <div className="home-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {professor?.name.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's what's happening in your classes today.</p>
        </div>
        <div className="header-actions">
          <Button onClick={() => navigate('/classes')} variant="secondary">
            Manage Classes
          </Button>
        </div>
      </header>

      <section className="stats-grid">
        <Card className="stat-card">
          <div className="stat-card-icon"><Radio size={20} /></div>
          <div className="stat-card-body">
            <span className="stat-card-label">Active sessions</span>
            <span className="stat-card-value">{sessionsLoading ? '—' : activeSessions.length}</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-icon"><Users size={20} /></div>
          <div className="stat-card-body">
            <span className="stat-card-label">Total students</span>
            <span className="stat-card-value">{isLoading ? '—' : totalStudents}</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-icon"><Layers size={20} /></div>
          <div className="stat-card-body">
            <span className="stat-card-label">Classes</span>
            <span className="stat-card-value">{isLoading ? '—' : classes.length}</span>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-card-icon"><Calendar size={20} /></div>
          <div className="stat-card-body">
            <span className="stat-card-label">All sessions</span>
            <span className="stat-card-value">{isLoading ? '—' : totalSessions}</span>
          </div>
        </Card>
      </section>

      {!sessionsLoading && activeSessions.length > 0 && (
        <section className="active-sessions">
          <h2 className="section-title">Active Sessions</h2>
          <div className="active-sessions-list">
            {activeSessions.map((session) => (
              <Card
                key={session.id}
                className="active-session-card"
                hoverLift
                onClick={() => navigate(`/sessions/${session.id}`)}
              >
                <div className="active-session-main">
                  <span className="live-dot" />
                  <div>
                    <h3>{session.title}</h3>
                    <p className="text-sm text-muted">
                      {session.class?.className || 'Class'} · Code{' '}
                      <strong className="font-mono">{session.sessionCode}</strong>
                    </p>
                  </div>
                </div>
                <div className="active-session-meta">
                  <Badge status="IN_PROGRESS">LIVE</Badge>
                  <span className="text-sm text-muted">
                    {session._count?.participants || 0} joined
                  </span>
                  <Button size="sm" variant="secondary">Open →</Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Card className="action-card" hoverLift onClick={() => navigate('/sessions/new')}>
            <div className="action-icon bg-primary-100 text-primary-600">
              <Play size={24} />
            </div>
            <div className="action-content">
              <h3>Start a Session</h3>
              <p>Launch a new monitoring session for an existing class.</p>
            </div>
          </Card>
          
          <Card className="action-card" hoverLift onClick={() => navigate('/classes?create=true')}>
            <div className="action-icon bg-success-100 text-success-600">
              <Plus size={24} />
            </div>
            <div className="action-content">
              <h3>Create Class</h3>
              <p>Setup a new class and upload your student roster.</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="recent-classes">
        <div className="section-header">
          <h2 className="section-title">Your Classes</h2>
          <Link to="/classes" className="view-all-link">View all</Link>
        </div>

        {isLoading ? (
          <div className="classes-grid">
            {[1, 2, 3].map(i => (
              <Card key={i} className="class-card-skeleton">
                <Skeleton height={24} width="60%" className="mb-2" />
                <Skeleton height={16} width="40%" className="mb-6" />
                <div className="flex-between">
                  <Skeleton height={16} width="30%" />
                  <Skeleton height={16} width="30%" />
                </div>
              </Card>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No classes yet"
            description="Create your first class to start tracking student progress in real-time."
            action={<Button onClick={() => navigate('/classes?create=true')}>Create Class</Button>}
          />
        ) : (
          <div className="classes-grid">
            {recentClasses.map(cls => (
              <Card key={cls.id} className="class-card" hoverLift onClick={() => navigate(`/classes/${cls.id}`)}>
                <div className="class-card-header">
                  <h3>{cls.className}</h3>
                  <div className="class-stats">
                    <div className="stat">
                      <Users size={14} />
                      <span>{cls._count?.enrollments || 0} students</span>
                    </div>
                  </div>
                </div>
                <div className="class-card-footer">
                  <span className="text-sm text-muted">Created {new Date(cls.createdAt).toLocaleDateString()}</span>
                  <Button size="sm" variant="ghost">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="activity-timeline">
        <h2 className="section-title">Recent activity</h2>
        <Card className="activity-card">
          {activeSessions.length > 0 ? (
            <ul className="activity-list">
              {activeSessions.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Activity size={14} />
                  <span>
                    Session <strong>{s.title}</strong> is live
                    {s.class?.className ? ` in ${s.class.className}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No recent activity. Start a session to see live updates here.</p>
          )}
        </Card>
      </section>
    </div>
  );
};
