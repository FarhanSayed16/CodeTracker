import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Calendar, Plus, Upload, Shield, ShieldOff, UserMinus, UserPlus } from 'lucide-react';
import {
  classService,
  type Student,
  type ImportPreview,
  type ImportResult,
} from '../../services/classService';
import { sessionService, type SessionItem } from '../../services/sessionService';
import { useToast } from '../../context/ToastContext';
import { RosterUpload } from '../../components/RosterUpload';
import {
  Card,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  EmptyState,
  Badge,
  Tabs,
  Input,
} from '../../components/ui';

export const ClassDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [addRoll, setAddRoll] = useState('');
  const [addName, setAddName] = useState('');
  const [addMember, setAddMember] = useState('');
  const [adding, setAdding] = useState(false);

  const [poolQuery, setPoolQuery] = useState('');
  const [poolResults, setPoolResults] = useState<Student[]>([]);
  const [poolSearching, setPoolSearching] = useState(false);

  const fetchClassDetails = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setIsLoading(true);
      const [clsRes, sessionsRes] = await Promise.all([
        classService.getClass(id),
        sessionService.getSessions(id),
      ]);
      setClassData(clsRes);
      setStudents(clsRes.students || []);
      setSessions(sessionsRes);
    } catch {
      toast.error('Failed to load class details');
      navigate('/classes');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchClassDetails();
  }, [fetchClassDetails]);

  useEffect(() => {
    if (!id || poolQuery.trim().length < 2) {
      setPoolResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setPoolSearching(true);
        const results = await classService.searchPool(id, poolQuery.trim());
        setPoolResults(results);
      } catch {
        setPoolResults([]);
      } finally {
        setPoolSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [id, poolQuery]);

  const handlePreviewFile = async (file: File) => {
    if (!id) return;
    try {
      setIsUploading(true);
      setImportResult(null);
      const result = await classService.previewImport(id, file);
      setPreview(result);
      setPendingFile(file);
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse file');
      setPreview(null);
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!id || !pendingFile) return;
    try {
      setIsUploading(true);
      const result = await classService.importStudents(id, pendingFile);
      setImportResult(result);
      setPreview(null);
      setPendingFile(null);
      toast.success(
        `Import complete — ${result.enrolled} enrolled (${result.created} new, ${result.linked} from pool, ${result.alreadyEnrolled} already in class)`
      );
      fetchClassDetails(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import students');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetPin = async (studentId: string, studentName: string) => {
    if (!id) return;
    if (!confirm(`Reset PIN for ${studentName}? They will create a new PIN on next join.`)) return;
    try {
      await classService.resetStudentPin(id, studentId);
      toast.success(`PIN reset for ${studentName}`);
      fetchClassDetails(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset PIN');
    }
  };

  const handleUnenroll = async (studentId: string, studentName: string) => {
    if (!id) return;
    if (!confirm(`Remove ${studentName} from this class? Their global profile is kept.`)) return;
    try {
      await classService.unenrollStudent(id, studentId);
      toast.success(`Removed ${studentName} from class`);
      fetchClassDetails(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove student');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !addRoll.trim() || !addName.trim()) return;
    try {
      setAdding(true);
      await classService.addStudent(id, {
        rollNo: addRoll.trim(),
        name: addName.trim(),
        membershipId: addMember.trim() || undefined,
      });
      toast.success('Student enrolled');
      setAddRoll('');
      setAddName('');
      setAddMember('');
      fetchClassDetails(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  const handleEnrollFromPool = async (student: Student) => {
    if (!id) return;
    try {
      await classService.addStudent(id, {
        rollNo: student.rollNo,
        name: student.name,
        membershipId: student.membershipId,
      });
      toast.success(`Enrolled ${student.name}`);
      setPoolQuery('');
      setPoolResults([]);
      fetchClassDetails(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll');
    }
  };

  if (isLoading || !classData) {
    return <div className="p-8">Loading class details...</div>;
  }

  const RosterTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Card>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '16px' }}>
          <Upload size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          Import Students from Excel / CSV
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: 'var(--text-sm)' }}>
          Upload an attendance sheet. Preview rows before confirming. Existing students are linked, not
          duplicated.
        </p>
        <RosterUpload onUpload={handlePreviewFile} isLoading={isUploading} />

        {preview && (
          <div style={{ marginTop: 16 }}>
            <p style={{ marginBottom: 8, fontSize: 'var(--text-sm)' }}>
              Parsed <strong>{preview.totalParsed}</strong> students
              {preview.truncated ? ' (showing first 50)' : ''}. Confirm to enroll.
            </p>
            <div style={{ maxHeight: 240, overflow: 'auto', marginBottom: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Roll No.</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Member ID</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.preview.map((row) => (
                    <TableRow key={row.rollNo}>
                      <TableCell style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.rollNo}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.membershipId || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleConfirmImport} isLoading={isUploading}>
                Confirm Import
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setPendingFile(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {importResult && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'var(--bg-success-subtle, rgba(16, 185, 129, 0.1))',
              borderRadius: '8px',
              fontSize: 'var(--text-sm)',
            }}
          >
            <strong>Import Results:</strong> {importResult.created} created, {importResult.linked}{' '}
            linked, {importResult.alreadyEnrolled} already enrolled.
            {importResult.skipped > 0 && ` ${importResult.skipped} skipped.`}
            {importResult.errors?.length > 0 && (
              <ul style={{ marginTop: '8px', color: 'var(--color-danger)' }}>
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 12 }}>
          <UserPlus size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Add Student Manually
        </h3>
        <form
          onSubmit={handleAddStudent}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr auto', gap: 12, alignItems: 'end' }}
        >
          <Input label="Roll No." value={addRoll} onChange={(e) => setAddRoll(e.target.value)} required />
          <Input label="Name" value={addName} onChange={(e) => setAddName(e.target.value)} required />
          <Input
            label="Member ID (optional)"
            value={addMember}
            onChange={(e) => setAddMember(e.target.value)}
          />
          <Button type="submit" isLoading={adding}>
            Add
          </Button>
        </form>

        <div style={{ marginTop: 20 }}>
          <Input
            label="Or search institution pool to enroll"
            placeholder="Type name or roll (min 2 chars)"
            value={poolQuery}
            onChange={(e) => setPoolQuery(e.target.value)}
          />
          {poolSearching && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>Searching…</p>
          )}
          {poolResults.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
              {poolResults.map((s) => (
                <li
                  key={s.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <span>
                    <strong>{s.name}</strong>{' '}
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.rollNo}</span>
                    {s.enrollmentCount != null && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 8 }}>
                        in {s.enrollmentCount} class{s.enrollmentCount === 1 ? '' : 'es'}
                      </span>
                    )}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => handleEnrollFromPool(s)}>
                    Enroll
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {students.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Empty Roster"
          description="Import an Excel attendance sheet or add students manually."
        />
      ) : (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
              Student Roster ({students.length})
            </h3>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Roll No.</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader>Member ID</TableHeader>
                <TableHeader>PIN</TableHeader>
                <TableHeader>Classes</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell
                    style={{ fontWeight: 500, fontFamily: 'var(--font-mono, monospace)', fontSize: '13px' }}
                  >
                    {student.rollNo}
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell style={{ fontSize: 13 }}>{student.membershipId || '—'}</TableCell>
                  <TableCell>
                    {student.hasPin ? (
                      <Badge status="DONE">
                        <Shield size={12} /> Set
                      </Badge>
                    ) : (
                      <Badge status="DEFAULT">
                        <ShieldOff size={12} /> Not Set
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{student.enrollmentCount ?? 1}</TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {student.hasPin && (
                        <button
                          type="button"
                          onClick={() => handleResetPin(student.id, student.name)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Reset PIN
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUnenroll(student.id, student.name)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          color: 'var(--color-danger, #b91c1c)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <UserMinus size={12} /> Remove
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );

  const SessionsTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => navigate(`/sessions/new?classId=${id}`)}>
          <Plus size={18} /> New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions yet"
          description="Start a new session to begin monitoring your class."
          action={
            <Button onClick={() => navigate(`/sessions/new?classId=${id}`)}>Start First Session</Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {sessions.map((session) => (
            <Card
              key={session.id}
              hoverLift
              onClick={() => navigate(`/sessions/${session.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{session.title}</h3>
                <Badge status={session.status === 'ACTIVE' ? 'IN_PROGRESS' : 'DEFAULT'}>
                  {session.status}
                </Badge>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Started: {new Date(session.startedAt).toLocaleString()}
                {session.sessionCode && (
                  <span style={{ marginLeft: '12px', fontFamily: 'var(--font-mono)' }}>
                    Code: {session.sessionCode}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <header className="page-header mb-6" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">{classData.className}</h1>
        </div>
      </header>

      <Tabs
        activeTabId={searchParams.get('tab') || 'sessions'}
        onChange={(tabId) => setSearchParams({ tab: tabId }, { replace: true })}
        tabs={[
          { id: 'sessions', label: 'Sessions', content: SessionsTab },
          { id: 'roster', label: `Student Roster (${students.length})`, content: RosterTab },
        ]}
      />
    </div>
  );
};
