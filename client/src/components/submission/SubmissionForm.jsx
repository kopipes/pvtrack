import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DialogClose } from '../ui/Dialog';
import api from '../../lib/axios';
import { toast } from 'sonner';

export function SubmissionForm({ projectId, submission, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch project members first; fall back to all active users
    if (projectId) {
      api.get(`/projects/${projectId}/members`)
        .then((res) => {
          const members = res.data.data || [];
          if (members.length > 0) {
            setUsers(members.map((m) => ({ id: m.userId, name: m.user?.name || m.userId })));
          } else {
            return api.get('/users', { params: { isActive: 'true' } })
              .then((r) => setUsers(r.data.data.map((u) => ({ id: u.id, name: u.name }))));
          }
        })
        .catch(() => {
          api.get('/users', { params: { isActive: 'true' } })
            .then((r) => setUsers(r.data.data.map((u) => ({ id: u.id, name: u.name }))))
            .catch(() => {});
        });
    }
  }, [projectId]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: submission ? {
      title: submission.title,
      description: submission.description || '',
      status: submission.status,
      assignedUserId: submission.assignedUserId || '',
      deadline: submission.deadline ? submission.deadline.split('T')[0] : '',
    } : { status: 'TODO', assignedUserId: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, assignedUserId: data.assignedUserId || null };
      if (submission) {
        await api.put(`/submissions/${submission.id}`, payload);
      } else {
        await api.post(`/projects/${projectId}/submissions`, payload);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save submission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sub-title">Title *</Label>
        <Input
          id="sub-title"
          placeholder="Submission title"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub-desc">Description</Label>
        <Textarea
          id="sub-desc"
          placeholder="What does this submission cover?"
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sub-status">Status</Label>
          <Select id="sub-status" {...register('status')}>
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
          <Label htmlFor="sub-deadline">Deadline</Label>
          <Input id="sub-deadline" type="date" {...register('deadline')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub-assignee">Assign To</Label>
        <Select id="sub-assignee" {...register('assignedUserId')}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {submission ? 'Save Changes' : 'Create Submission'}
        </Button>
      </div>
    </form>
  );
}
