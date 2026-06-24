import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Mail, Phone, Building2 } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Skeleton } from '../ui/Skeleton';
import { Dialog, DialogContent, DialogClose } from '../ui/Dialog';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

function ClientContactForm({ contact, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: contact ? {
      name: contact.name,
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      notes: contact.notes || '',
    } : {},
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (contact) {
        await api.put(`/client-contacts/${contact.id}`, data);
      } else {
        await api.post('/client-contacts', data);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cc-name">Full Name *</Label>
        <Input id="cc-name" placeholder="Diana Prince" {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cc-company">Company</Label>
          <Input id="cc-company" placeholder="Acme Corp" {...register('company')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-position">Position</Label>
          <Input id="cc-position" placeholder="Head of Digital" {...register('position')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cc-email">Email</Label>
          <Input
            id="cc-email" type="email" placeholder="diana@acme.com"
            {...register('email', {
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
            })}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-phone">Phone</Label>
          <Input id="cc-phone" placeholder="+62 812-3456-7890" {...register('phone')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cc-notes">Notes</Label>
        <Textarea id="cc-notes" placeholder="Any relevant notes about this contact..." rows={3} {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {contact ? 'Save Changes' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
}

export default function ClientContactsTab() {
  const { isAdminOrManager } = useAuth();
  const { isAdmin } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/client-contacts', { params });
      setContacts(res.data.data);
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleDelete = async (contact) => {
    if (!confirm(`Delete "${contact.name}"? This will unlink them from all projects.`)) return;
    try {
      await api.delete(`/client-contacts/${contact.id}`);
      toast.success('Contact deleted');
      fetchContacts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdminOrManager && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Contact
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <div className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))
        ) : contacts.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Building2 className="h-12 w-12 opacity-30" />
              <p className="font-medium">No client contacts yet</p>
            </div>
          </div>
        ) : (
          contacts.map((contact) => (
            <Card
              key={contact.id}
              className="p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={contact.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{contact.name}</p>
                    {contact.position && (
                      <p className="text-xs text-muted-foreground">{contact.position}</p>
                    )}
                  </div>
                </div>
                {isAdminOrManager && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => setEditTarget(contact)} aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="hover:text-destructive" onClick={() => handleDelete(contact)} aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {contact.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{contact.company}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="truncate hover:text-primary transition-colors">{contact.email}</a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>

              {contact._count?.projects > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {contact._count.projects} project{contact._count.projects !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {contact.notes && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">{contact.notes}</p>
              )}
            </Card>
          ))
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="New Client Contact" description="Add a new external client contact.">
          <ClientContactForm onSuccess={() => { setCreateOpen(false); fetchContacts(); toast.success('Contact created'); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent title="Edit Client Contact">
          {editTarget && (
            <ClientContactForm
              contact={editTarget}
              onSuccess={() => { setEditTarget(null); fetchContacts(); toast.success('Contact updated'); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
