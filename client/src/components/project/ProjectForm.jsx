import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DialogClose } from '../ui/Dialog';
import { Avatar } from '../ui/Avatar';
import api from '../../lib/axios';
import { toast } from 'sonner';

export function ProjectForm({ project, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [clientContacts, setClientContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: project ? {
      title: project.title,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      picId: project.picId,
      clientContactId: project.clientContactId || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
    } : { status: 'DRAFT', priority: 'MEDIUM', clientContactId: '' },
  });

  useEffect(() => {
    // Fetch users (for PIC selector) and client contacts in parallel
    Promise.all([
      api.get('/users', { params: { isActive: 'true' } }),
      api.get('/client-contacts'),
    ])
      .then(([usersRes, contactsRes]) => {
        setUsers(usersRes.data.data);
        setClientContacts(contactsRes.data.data);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, clientContactId: data.clientContactId || null };
      if (project) {
        await api.put(`/projects/${project.id}`, payload);
      } else {
        await api.post('/projects', payload);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title *</Label>
        <Input
          id="title"
          placeholder="Enter project title"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the project scope and goals"
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...register('status')}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" {...register('priority')}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" {...register('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline *</Label>
          <Input
            id="deadline"
            type="date"
            {...register('deadline', { required: 'Deadline is required' })}
          />
          {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="picId">Person in Charge (PIC) *</Label>
        <Select id="picId" {...register('picId', { required: 'PIC is required' })}>
          <option value="">Select PIC...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role}{u.division ? ` — ${u.division.name}` : ''})
            </option>
          ))}
        </Select>
        {errors.picId && <p className="text-xs text-destructive">{errors.picId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientContactId">Client Contact</Label>
        <Select id="clientContactId" {...register('clientContactId')}>
          <option value="">No client contact</option>
          {clientContacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.company ? ` — ${c.company}` : ''}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {project ? 'Save Changes' : 'Create Project'}
        </Button>
      </div>
    </form>
  );
}
