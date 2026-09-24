import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import { Card, Button, Input, Modal, ConfirmDialog, Skeleton, EmptyState } from '../../components/ui';

export const ClassesListPage: React.FC = () => {
  const { classes, isLoading, fetchClasses, createClass, deleteClass } = useClasses();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(searchParams.get('create') === 'true');
  const [newClassName, setNewClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    setIsCreateModalOpen(searchParams.get('create') === 'true');
  }, [searchParams]);

  const handleOpenCreate = () => {
    setSearchParams({ create: 'true' });
  };

  const handleCloseCreate = () => {
    setSearchParams({});
    setNewClassName('');
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setIsCreating(true);
      await createClass(newClassName.trim());
      handleCloseCreate();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header mb-6">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">Manage your classes and student rosters.</p>
        </div>
        <Button onClick={handleOpenCreate}><Plus size={18} /> New Class</Button>
      </header>

      {isLoading ? (
        <div className="classes-grid">
          {[1, 2, 3].map(i => (
            <Card key={i} className="class-card-skeleton">
              <Skeleton height={24} width="60%" className="mb-2" />
              <Skeleton height={16} width="40%" className="mb-6" />
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No classes found"
          description="You haven't created any classes yet."
          action={<Button onClick={handleOpenCreate}>Create Class</Button>}
        />
      ) : (
        <div className="classes-grid">
          {classes.map(cls => (
            <Card key={cls.id} className="class-card" hoverLift>
              <div className="class-card-header" onClick={() => navigate(`/classes/${cls.id}`)}>
                <h3>{cls.className}</h3>
                <div className="class-stats">
                  <div className="stat">
                    <Users size={14} />
                    <span>{cls._count?.enrollments || 0} students</span>
                  </div>
                </div>
              </div>
              <div className="class-card-footer flex-between">
                <Button size="sm" variant="ghost" onClick={() => navigate(`/classes/${cls.id}`)}>
                  View Details
                </Button>
                <button
                  className="icon-btn text-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setClassToDelete(cls.id);
                  }}
                  title="Delete Class"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={handleCloseCreate} title="Create New Class">
        <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Class Name"
            placeholder="e.g. CS 101 - Fall 2026"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            required
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="ghost" onClick={handleCloseCreate}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create Class</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        onConfirm={async () => {
          if (classToDelete) {
            await deleteClass(classToDelete);
            setClassToDelete(null);
          }
        }}
        title="Delete Class"
        message="Are you sure you want to delete this class? Associated sessions and students will be removed. Active sessions must be ended first."
        confirmText="Delete Class"
        isDestructive
      />
    </div>
  );
};
