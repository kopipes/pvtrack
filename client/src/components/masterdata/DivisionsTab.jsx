import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { Dialog, DialogContent, DialogClose } from '../ui/Dialog';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

function DivisionForm({ division, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: division ? { name: division.name, description: division.description || '' } : {},
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (division) {
        await api.put(`/divisions/${division.id}`, data);
      } else {
        await api.post('/divisions', data);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save division');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="div-name">Division Name *</Label>
        <Input id="div-name" placeholder="e.g. Engineering" {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="div-desc">Description</Label>
        <Textarea id="div-desc" placeholder="Brief description of this division" rows={3} {...register('description')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {division ? 'Save Changes' : 'Create Division'}
        </Button>
      </div>
    </form>
  );
}

function DivisionRow({ division, isAdmin, onEdit, onDelete, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadMembers = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    setLoadingMembers(true);
    try {
      const res = await api.get(`/divisions/${division.id}`);
      setMembers(res.data.data.users || []);
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-accent/40 transition-colors">
        <td className="px-6 py-4">
          <div>
            <p className="font-medium">{division.name}</p>
            {division.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{division.description}</p>
            )}
          </div>
        </td>
        <td className="px-4 py-4">
          <button
            onClick={loadMembers}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            {division._count?.users ?? 0} members
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        </td>
        <td className="px-4 py-4">
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            division.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          )}>
            {division.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        {isAdmin && (
          <td className="px-4 py-4">
            <div className="flex items-center gap-1 justify-end">
              <Button size="icon" variant="ghost" onClick={() => onEdit(division)} aria-label="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon" variant="ghost"
                className="hover:text-destructive"
                onClick={() => onDelete(division)}
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </td>
        )}
      </tr>

      {expanded && (
        <tr>
          <td colSpan={isAdmin ? 4 : 3} className="px-6 pb-4">
            <div className="rounded-lg bg-muted/40 p-4">
              {loadingMembers ? (
                <div className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-8 rounded-full" />)}</div>
              ) : members.length === 0 ? (
                <p className="text-xs text-muted-foreground">No members in this division</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Avatar name={m.name} size="xs" />
                      <div>
                        <p className="text-xs font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function DivisionsTab() {
  const { isAdmin } = useAuth();
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fetchDivisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/divisions');
      setDivisions(res.data.data);
    } catch {
      toast.error('Failed to load divisions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDivisions(); }, [fetchDivisions]);

  const handleDelete = async (division) => {
    if (!confirm(`Delete division "${division.name}"? Members will be unlinked.`)) return;
    try {
      await api.delete(`/divisions/${division.id}`);
      toast.success('Division deleted');
      fetchDivisions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Division
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Division</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Members</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    {isAdmin && <td className="px-4 py-4"><Skeleton className="h-7 w-16" /></td>}
                  </tr>
                ))
              ) : divisions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">No divisions yet</td></tr>
              ) : (
                divisions.map((div) => (
                  <DivisionRow
                    key={div.id}
                    division={div}
                    isAdmin={isAdmin}
                    onEdit={setEditTarget}
                    onDelete={handleDelete}
                    onRefresh={fetchDivisions}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="New Division">
          <DivisionForm onSuccess={() => { setCreateOpen(false); fetchDivisions(); toast.success('Division created'); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent title="Edit Division">
          {editTarget && (
            <DivisionForm
              division={editTarget}
              onSuccess={() => { setEditTarget(null); fetchDivisions(); toast.success('Division updated'); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
