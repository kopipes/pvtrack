import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DialogClose } from '../ui/Dialog';
import api from '../../lib/axios';

export function SubmissionForm({ projectId, submission, members = [], onSuccess }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: submission ? {
      title: submission.title,
      description: submission.description || '',
      status: submission.status,
      assignedUserId: submission.assignedUserId || '',
      deadline: submission.deadline ? submission.deadline.split('T')[0] : '',
    } : { status: 'TODO' },
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
      console.error(err);
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

      {members.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="sub-assignee">Assign To</Label>
          <Select id="sub-assignee" {...register('assignedUserId')}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.user?.name || m.userId}</option>
            ))}
          </Select>
        </div>
      )}

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
