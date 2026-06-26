import { useState, useEffect, useCallback } from 'react';
import { Trash2, Loader2, UserPlus, Shield } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const ROLE_COLOR = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  MANAGER: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  USER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  VIEWER: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export function MembersPanel({ projectId, picId }) {
  const { isAdminOrManager } = useAuth();
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [canCreate, setCanCreate] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      setMembers(res.data.data);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
    api.get('/users', { params: { isActive: 'true' } })
      .then((res) => setAllUsers(res.data.data))
      .catch(() => {});
  }, [fetchMembers]);

  const memberIds = new Set(members.map((m) => m.userId));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setAdding(true);
    try {
      await api.post(`/projects/${projectId}/members`, {
        userId: selectedUserId,
        canCreateSubmission: canCreate,
      });
      setSelectedUserId('');
      setCanCreate(false);
      fetchMembers();
      toast.success('Member added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId) => {
    if (userId === picId) {
      toast.error('Cannot remove the PIC from the project');
      return;
    }
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchMembers();
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleToggleCanCreate = async (member) => {
    try {
      // Re-add with toggled flag (upsert via PUT)
      await api.post(`/projects/${projectId}/members`, {
        userId: member.userId,
        canCreateSubmission: !member.canCreateSubmission,
      });
      fetchMembers();
    } catch (err) {
      // If member already exists, use a direct update approach
      toast.error(err.response?.data?.message || 'Failed to update permission');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Project Members</h3>
        <span className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <Avatar name={m.user?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{m.user?.name}</p>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', ROLE_COLOR[m.user?.role])}>
                    {m.user?.role}
                  </span>
                  {m.userId === picId && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">PIC</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
              </div>

              {/* Can create submission toggle */}
              {isAdminOrManager && (
                <button
                  onClick={() => handleToggleCanCreate(m)}
                  title={m.canCreateSubmission ? 'Can create submissions' : 'Cannot create submissions'}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
                    m.canCreateSubmission
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Shield className="h-3 w-3" />
                  {m.canCreateSubmission ? 'Can create' : 'Read only'}
                </button>
              )}

              {/* Remove */}
              {isAdminOrManager && m.userId !== picId && (
                <button
                  onClick={() => handleRemove(m.userId)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add member */}
      {isAdminOrManager && availableUsers.length > 0 && (
        <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Add Member</p>
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="text-sm"
          >
            <option value="">Select a user...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}{u.divisions?.length > 0 ? ` — ${u.divisions.map(d => d.division?.name).join(', ')}` : ''})
              </option>
            ))}
          </Select>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={canCreate}
                onChange={(e) => setCanCreate(e.target.checked)}
                className="rounded"
              />
              Can create submissions
            </label>
            <Button size="sm" onClick={handleAdd} disabled={adding || !selectedUserId}>
              {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
