import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as RadixDialog from '@radix-ui/react-dialog';
import {
  X, Loader2, Plus, Trash2, MessageSquare,
  RotateCcw, Paperclip, Check, Pencil, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react';
import { useSubmission } from '../../hooks/useSubmissions';
import { useAuth } from '../../contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Avatar } from '../ui/Avatar';

import { ProgressBar } from '../ui/ProgressBar';
import { Skeleton } from '../ui/Skeleton';
import { cn, STATUS_CONFIG, formatDate, isOverdue, timeAgo } from '../../lib/utils';
import api from '../../lib/axios';
import { toast } from 'sonner';

// ── Progress quick-set buttons ────────────────────────────────────────────────
function ProgressSection({ submission, onUpdate }) {
  const [value, setValue] = useState(submission.progress);
  const [saving, setSaving] = useState(false);

  const isLocked = ['APPROVED', 'DONE'].includes(submission.status);

  const save = async (v) => {
    if (isLocked) return;
    setSaving(true);
    try {
      await api.patch(`/submissions/${submission.id}/progress`, { progress: v });
      setValue(v);
      onUpdate();
      toast.success('Progress updated');
    } catch {
      toast.error('Failed to update progress');
    } finally {
      setSaving(false);
    }
  };

  if (isLocked) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Progress</Label>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">100%</span>
        </div>
        <ProgressBar value={100} size="lg" />
        <p className="text-xs text-muted-foreground">
          Progress is locked at 100% — submission is {submission.status.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Progress</Label>
        <span className="text-sm font-semibold">{value}%</span>
      </div>
      <ProgressBar value={value} size="lg" />
      <div className="flex gap-2">
        {[0, 25, 50, 75, 100].map((v) => (
          <Button
            key={v}
            size="sm"
            variant={value === v ? 'default' : 'outline'}
            className="flex-1 text-xs"
            onClick={() => save(v)}
            disabled={saving}
          >
            {v}%
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Math.min(100, Math.max(0, Number(e.target.value))))}
          className="w-24 text-sm"
        />
        <Button size="sm" onClick={() => save(value)} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
        </Button>
      </div>
    </div>
  );
}

// ── Delete submission button ───────────────────────────────────────────────
function DeleteSubmissionButton({ submissionId, projectId, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    setLoading(true);
    try {
      await api.delete(`/submissions/${submissionId}`);
      toast.success('Submission deleted');
      onDeleted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto" onClick={handleDelete} disabled={loading}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Delete
    </Button>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ submission, onUpdate }) {
  const { isAdminOrManager, canWrite } = useAuth();
  const [actionLoading, setActionLoading] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: submission.title,
      description: submission.description || '',
      status: submission.status,
      deadline: submission.deadline ? new Date(submission.deadline).toLocaleDateString('en-CA') : '',
      assignedUserId: submission.assignedUserId || '',
    },
  });

  useEffect(() => {
    if (editing && users.length === 0) {
      api.get(`/projects/${submission.projectId}/members`)
        .then((res) => {
          const members = res.data.data || [];
          if (members.length > 0) {
            setUsers(members.map((m) => ({ id: m.userId, name: m.user?.name || m.userId })));
          } else {
            api.get('/users', { params: { isActive: 'true' } })
              .then((r) => setUsers(r.data.data.map((u) => ({ id: u.id, name: u.name }))));
          }
        })
        .catch(() => {
          api.get('/users', { params: { isActive: 'true' } })
            .then((r) => setUsers(r.data.data.map((u) => ({ id: u.id, name: u.name }))))
            .catch(() => {});
        });
    }
  }, [editing]);

  const startEdit = () => {
    reset({
      title: submission.title,
      description: submission.description || '',
      status: submission.status,
      deadline: submission.deadline ? new Date(submission.deadline).toLocaleDateString('en-CA') : '',
      assignedUserId: submission.assignedUserId || '',
    });
    setEditing(true);
  };

  const saveEdit = async (data) => {
    setEditLoading(true);
    try {
      await api.put(`/submissions/${submission.id}`, {
        ...data,
        assignedUserId: data.assignedUserId || null,
        deadline: data.deadline || null,
      });
      toast.success('Submission updated');
      setEditing(false);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setEditLoading(false);
    }
  };

  const statusCfg = STATUS_CONFIG[submission.status];
  const overdue = isOverdue(submission.deadline) && !['APPROVED', 'DONE'].includes(submission.status);
  const isLocked = ['APPROVED', 'DONE'].includes(submission.status);

  const doAction = async (endpoint, successMsg) => {
    setActionLoading(endpoint);
    try {
      await api.patch(`/submissions/${submission.id}/${endpoint}`);
      toast.success(successMsg);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit(saveEdit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input {...register('title', { required: true })} className="text-sm" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea {...register('description')} rows={3} className="text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select {...register('status')}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVISION">Revision</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="APPROVED">Approved</option>
              <option value="DONE">Done</option>
              <option value="ON_HOLD">On Hold</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deadline</Label>
            <Input type="date" {...register('deadline')} className="text-sm" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Assign To</Label>
          <Select {...register('assignedUserId')}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" disabled={editLoading}>
            {editLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {/* Edit button */}
      {canWrite && !isLocked && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={startEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit Details
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Status</p>
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg?.color)}>
            {statusCfg?.label || submission.status}
          </span>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Deadline</p>
          <p className={cn('font-medium', overdue && 'text-red-500')}>
            {submission.deadline ? formatDate(submission.deadline) : 'No deadline'}
            {overdue && ' (overdue)'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Assigned To</p>
          {submission.assignedUser ? (
            <div className="flex items-center gap-2">
              <Avatar name={submission.assignedUser.name} size="xs" />
              <span className="font-medium">{submission.assignedUser.name}</span>
            </div>
          ) : (
            <p className="text-muted-foreground">Unassigned</p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Created</p>
          <p className="font-medium">{formatDate(submission.createdAt)}</p>
        </div>
      </div>

      {submission.description && (
        <div>
          <p className="text-muted-foreground text-sm mb-1">Description</p>
          <p className="text-sm leading-relaxed">{submission.description}</p>
        </div>
      )}

      {(canWrite || isLocked) && (
        <ProgressSection submission={submission} onUpdate={onUpdate} />
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {canWrite && ['TODO', 'IN_PROGRESS'].includes(submission.status) && (
          <Button size="sm" onClick={() => doAction('submit', 'Work submitted for review')} disabled={!!actionLoading}>
            {actionLoading === 'submit' && <Loader2 className="h-3 w-3 animate-spin" />}
            Submit Work
          </Button>
        )}
        {isAdminOrManager && ['SUBMITTED', 'RESUBMITTED'].includes(submission.status) && (
          <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => doAction('approve', 'Submission approved')} disabled={!!actionLoading}>
            {actionLoading === 'approve' && <Loader2 className="h-3 w-3 animate-spin" />}
            Approve
          </Button>
        )}
        {isAdminOrManager && submission.status === 'IN_PROGRESS' && (
          <Button size="sm" variant="outline" onClick={() => doAction('status', 'Status updated')} disabled={!!actionLoading}>
            Put On Hold
          </Button>
        )}
        {isAdminOrManager && (
          <DeleteSubmissionButton submissionId={submission.id} projectId={submission.project?.id} onDeleted={() => { onUpdate?.(); }} />
        )}
      </div>
    </div>
  );
}

// ── Checklist tab ─────────────────────────────────────────────────────────────
function ChecklistTab({ submission, onUpdate }) {
  const { canWrite: _canWrite } = useAuth();
  const isLocked = ['APPROVED', 'DONE'].includes(submission.status);
  const canWrite = _canWrite && !isLocked;
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);
  const items = submission.checklistItems || [];

  const inputRef = useRef(null);

  const addItem = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      await api.post(`/submissions/${submission.id}/checklist`, { title: newItem.trim() });
      setNewItem('');
      onUpdate();
      // Keep focus on input after adding
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      toast.error('Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const toggleItem = async (item) => {
    try {
      await api.patch(`/submissions/${submission.id}/checklist/${item.id}`, { isCompleted: !item.isCompleted });
      onUpdate();
    } catch {
      toast.error('Failed to update item');
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await api.delete(`/submissions/${submission.id}/checklist/${itemId}`);
      onUpdate();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const completed = items.filter((i) => i.isCompleted).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{completed} of {items.length} completed</span>
        <span className="font-medium">{items.length > 0 ? Math.round((completed / items.length) * 100) : 0}%</span>
      </div>

      {items.length > 0 && <ProgressBar value={items.length ? (completed / items.length) * 100 : 0} />}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 group">
            <button
              onClick={() => canWrite && toggleItem(item)}
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                item.isCompleted
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-border hover:border-primary',
                (!canWrite || isLocked) && 'cursor-default opacity-60'
              )}
              disabled={!canWrite || isLocked}
              aria-label={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.isCompleted && <Check className="h-3 w-3" />}
            </button>
            <span className={cn('flex-1 text-sm', item.isCompleted && 'line-through text-muted-foreground')}>
              {item.title}
            </span>
            {canWrite && (
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                aria-label="Delete item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canWrite && (
        <div className="flex gap-2 pt-2">
          <Input
            ref={inputRef}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add checklist item..."
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="text-sm"
            autoFocus
          />
          <Button size="sm" onClick={addItem} disabled={adding || !newItem.trim()}>
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      )}
      {isLocked && (
        <p className="text-xs text-muted-foreground pt-1">
          To-do list is locked — submission is {submission.status.toLowerCase()}.
        </p>
      )}
    </div>
  );
}

// ── Notes tab ─────────────────────────────────────────────────────────────────
function NotesTab({ submission, onUpdate }) {
  const { canWrite: _canWrite, user } = useAuth();
  const isLocked = ['APPROVED', 'DONE'].includes(submission.status);
  const canWrite = _canWrite && !isLocked;
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const notes = submission.notes || [];

  const addNote = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api.post(`/submissions/${submission.id}/notes`, { noteText: text.trim() });
      setText('');
      onUpdate();
    } catch {
      toast.error('Failed to add note');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No notes yet</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="flex gap-3">
            <Avatar name={note.user?.name} size="sm" />
            <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{note.user?.name}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(note.createdAt)}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.noteText}</p>
            </div>
          </div>
        ))}
      </div>

      {canWrite && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="text-sm"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={addNote} disabled={posting || !text.trim()}>
              {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Post Note
            </Button>
          </div>
        </div>
      )}
      {isLocked && (
        <p className="text-xs text-muted-foreground pt-1 border-t border-border">
          Notes are locked — submission is {submission.status.toLowerCase()}.
        </p>
      )}
    </div>
  );
}

// ── Revisions tab ─────────────────────────────────────────────────────────────
function RevisionsTab({ submission, onUpdate }) {
  const { isAdminOrManager, canWrite } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [posting, setPosting] = useState(false);
  const revisions = submission.revisions || [];

  const addRevision = async () => {
    if (!feedback.trim()) return;
    setPosting(true);
    try {
      await api.post(`/submissions/${submission.id}/revisions`, {
        feedback: feedback.trim(),
        ...(newDeadline && { newDeadline }),
      });
      setFeedback('');
      setNewDeadline('');
      onUpdate();
      toast.success('Revision requested');
    } catch {
      toast.error('Failed to create revision');
    } finally {
      setPosting(false);
    }
  };

  const REVISION_STATUS_COLOR = {
    OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  };

  return (
    <div className="space-y-4">
      {isAdminOrManager && (
        <div className="space-y-3 pb-2 border-b border-border">
          <Label>Request Revision</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe what needs to be revised..."
            rows={4}
            className="text-sm"
          />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">New Deadline (optional)</Label>
            <Input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="text-sm"
            />
            {submission.deadline && (
              <p className="text-xs text-muted-foreground">
                Current deadline: {new Date(submission.deadline).toLocaleDateString('en-CA')}
              </p>
            )}
          </div>
          <Button size="sm" onClick={addRevision} disabled={posting || !feedback.trim()} variant="outline">
            {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Request Revision
          </Button>
        </div>
      )}

      {revisions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No revisions yet</p>
      )}

      {revisions.map((rev) => (
        <div key={rev.id} className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Revision #{rev.revisionNumber}</span>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', REVISION_STATUS_COLOR[rev.status])}>
              {rev.status}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{rev.feedback}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>by {rev.createdBy?.name}</span>
            <span>{timeAgo(rev.createdAt)}</span>
          </div>
          {/* Per-revision action buttons */}
          {rev.status !== 'RESOLVED' && (
            <div className="flex gap-2 pt-1 border-t border-border">
              {canWrite && ['OPEN', 'IN_PROGRESS'].includes(rev.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={async () => {
                    try {
                      await api.patch(`/revisions/${rev.id}/status`, { status: 'IN_PROGRESS' });
                      onUpdate();
                      toast.success(`Revision #${rev.revisionNumber} submitted`);
                    } catch { toast.error('Failed to update revision'); }
                  }}
                >
                  Submit
                </Button>
              )}
              {isAdminOrManager && rev.status === 'IN_PROGRESS' && (
                <Button
                  size="sm"
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={async () => {
                    try {
                      await api.patch(`/revisions/${rev.id}/status`, { status: 'RESOLVED' });
                      onUpdate();
                      toast.success(`Revision #${rev.revisionNumber} approved`);
                    } catch { toast.error('Failed to update revision'); }
                  }}
                >
                  Approve
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Image lightbox modal ──────────────────────────────────────────────────────
function ImageLightbox({ images, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  const img = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-1.5 z-10"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-3 py-1 rounded-full">
          {index + 1} / {images.length}
        </span>
      )}

      {/* Prev arrow */}
      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 rounded-full p-2 z-10"
          onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img
          src={img.fileUrl}
          alt={img.fileName}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        <p className="text-white/60 text-xs truncate max-w-xs">{img.fileName}</p>
      </div>

      {/* Next arrow */}
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-black/40 rounded-full p-2 z-10"
          onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

// ── Attachments tab ───────────────────────────────────────────────────────────
function AttachmentsTab({ submission, onUpdate }) {
  const { canWrite: _canWrite } = useAuth();
  const isLocked = ['APPROVED', 'DONE'].includes(submission.status);
  const canWrite = _canWrite && !isLocked;
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { index }
  const attachments = submission.attachments || [];

  const images = attachments.filter((a) => a.fileType?.startsWith('image/'));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('submissionId', submission.id);
      await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUpdate();
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {lightbox !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {attachments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No attachments yet</p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightbox({ index: i })}
              className="relative aspect-square rounded-md overflow-hidden border border-border hover:border-primary group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <img
                src={img.fileUrl}
                alt={img.fileName}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* All files list */}
      <div className="space-y-2">
        {attachments.map((att) => {
          const isImage = att.fileType?.startsWith('image/');
          const imgIndex = isImage ? images.findIndex((i) => i.id === att.id) : -1;
          return (
            <div key={att.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{att.fileName}</p>
                <p className="text-xs text-muted-foreground">{att.fileType} · {att.uploadedBy?.name}</p>
              </div>
              {isImage ? (
                <button
                  onClick={() => setLightbox({ index: imgIndex })}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View
                </button>
              ) : (
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View
                </a>
              )}
            </div>
          );
        })}
      </div>

      {canWrite && (
        <div className="pt-2 border-t border-border">
          <label className={cn(
            'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 cursor-pointer',
            'hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground'
          )}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Paperclip className="h-4 w-4" /> Click to upload a file (max 10MB)</>
            )}
            <input type="file" className="sr-only" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}
      {isLocked && (
        <p className="text-xs text-muted-foreground pt-1 border-t border-border">
          File uploads are locked — submission is {submission.status.toLowerCase()}.
        </p>
      )}
    </div>
  );
}

// ── Activity tab ─────────────────────────────────────────────────────────────
function ActivityTab({ submission }) {
  const logs = submission.activityLogs || [];
  return (
    <div className="space-y-3">
      {logs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
      )}
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 text-sm">
          <Avatar name={log.user?.name} size="xs" />
          <div className="flex-1">
            <span className="font-medium">{log.user?.name}</span>
            {' '}
            <span className="text-muted-foreground">{log.description || log.action}</span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(log.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main slide-over ───────────────────────────────────────────────────────────
export function SubmissionSlideOver({ submissionId, open, onOpenChange, members = [], onUpdate }) {
  const { submission, loading, refetch } = useSubmission(open ? submissionId : null);

  const handleUpdate = () => {
    refetch();
    onUpdate?.();
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <RadixDialog.Content
          className={cn(
            'fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl',
            'bg-card border-l border-border shadow-2xl',
            'flex flex-col overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            'duration-300'
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b border-border shrink-0">
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <RadixDialog.Title className="font-semibold text-base leading-snug">
                    {submission?.title}
                  </RadixDialog.Title>
                  <p className="text-xs text-muted-foreground mt-1">
                    {submission?.project?.title}
                  </p>
                </>
              )}
            </div>
            <RadixDialog.Close className="rounded-lg p-1.5 hover:bg-accent transition-colors mt-0.5">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </RadixDialog.Close>
          </div>

          {/* Tabs */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : !submission ? (
              <div className="p-6 text-center text-muted-foreground">Submission not found</div>
            ) : (
              <Tabs defaultValue="overview" className="h-full flex flex-col">
                <div className="px-6 pt-4 shrink-0">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="checklist">
                      To-do
                      {submission._count?.checklistItems > 0 && (
                        <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">{submission._count.checklistItems}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      Notes
                      {submission._count?.notes > 0 && (
                        <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">{submission._count.notes}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="revisions">
                      Revisions
                      {submission._count?.revisions > 0 && (
                        <span className="ml-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 text-xs">{submission._count.revisions}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="attachments">Files</TabsTrigger>
                    <TabsTrigger value="activity">Log</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  <TabsContent value="overview">
                    <OverviewTab submission={submission} onUpdate={handleUpdate} />
                  </TabsContent>
                  <TabsContent value="checklist">
                    <ChecklistTab submission={submission} onUpdate={handleUpdate} />
                  </TabsContent>
                  <TabsContent value="notes">
                    <NotesTab submission={submission} onUpdate={handleUpdate} />
                  </TabsContent>
                  <TabsContent value="revisions">
                    <RevisionsTab submission={submission} onUpdate={handleUpdate} />
                  </TabsContent>
                  <TabsContent value="attachments">
                    <AttachmentsTab submission={submission} onUpdate={handleUpdate} />
                  </TabsContent>
                  <TabsContent value="activity">
                    <ActivityTab submission={submission} />
                  </TabsContent>
                </div>
              </Tabs>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
