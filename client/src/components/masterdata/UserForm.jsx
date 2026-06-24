import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { DialogClose } from '../ui/Dialog';

export default function UserForm({ user, onSuccess }) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      role: user.role,
      divisionId: user.divisionId || '',
      password: '',
    } : { role: 'USER', divisionId: '' },
  });

  useEffect(() => {
    api.get('/divisions').then((res) => setDivisions(res.data.data)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, divisionId: data.divisionId || null };
      if (!payload.password) delete payload.password; // Don't send empty password on edit
      if (user) {
        await api.put(`/users/${user.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="u-name">Full Name *</Label>
        <Input id="u-name" placeholder="John Doe" {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="u-email">Email *</Label>
        <Input
          id="u-email" type="email" placeholder="john@example.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
          })}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="u-password">{user ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
        <Input
          id="u-password" type="password" placeholder={user ? '••••••••' : 'Min 8 characters'}
          {...register('password', {
            ...(!user && { required: 'Password is required' }),
            minLength: { value: 8, message: 'Min 8 characters' },
            validate: (v) => !v || v.length >= 8 || 'Min 8 characters',
          })}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="u-role">Role</Label>
          <Select id="u-role" {...register('role')}>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="USER">User</option>
            <option value="VIEWER">Viewer</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-division">Division</Label>
          <Select id="u-division" {...register('divisionId')}>
            <option value="">No Division</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {user ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
