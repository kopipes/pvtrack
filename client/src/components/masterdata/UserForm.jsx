import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { DialogClose } from '../ui/Dialog';
import { cn } from '../../lib/utils';

export default function UserForm({ user, onSuccess }) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  // Selected division IDs (array)
  const [selectedDivisions, setSelectedDivisions] = useState(
    user ? (user.divisions || []).map((d) => d.divisionId || d.division?.id).filter(Boolean) : []
  );

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user ? {
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    } : { role: 'USER' },
  });

  useEffect(() => {
    api.get('/divisions').then((res) => setDivisions(res.data.data)).catch(() => {});
  }, []);

  const toggleDivision = (id) => {
    setSelectedDivisions((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, divisionIds: selectedDivisions };
      if (!payload.password) delete payload.password;
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
            validate: (v) => !v || v.length >= 8 || 'Min 8 characters',
          })}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

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
        <Label>Divisions</Label>
        {/* Selected tags */}
        {selectedDivisions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedDivisions.map((id) => {
              const div = divisions.find((d) => d.id === id);
              return div ? (
                <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                  {div.name}
                  <button type="button" onClick={() => toggleDivision(id)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
        {/* Dropdown to add */}
        <Select
          value=""
          onChange={(e) => { if (e.target.value) toggleDivision(e.target.value); }}
        >
          <option value="">Add a division...</option>
          {divisions
            .filter((d) => !selectedDivisions.includes(d.id))
            .map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
        </Select>
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
