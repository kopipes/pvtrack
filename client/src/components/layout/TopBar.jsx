import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, User, KeyRound, Loader2, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Dialog, DialogContent } from '../ui/Dialog';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { cn, timeAgo } from '../../lib/utils';

const BREADCRUMBS = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/projects': [{ label: 'Projects' }],
  '/reports': [{ label: 'Reports' }],
  '/master-data': [{ label: 'Master Data' }],
};

// ── Notifications dropdown ─────────────────────────────────────────
function NotificationsDropdown({ onClose }) {
  const navigate = useNavigate();
  const { notifications, loading } = useNotifications();

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold">Revisions Pending</p>
        {notifications.length > 0 && (
          <span className="rounded-full bg-red-500 text-white text-xs px-2 py-0.5">{notifications.length}</span>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && notifications.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No pending revisions
          </div>
        )}
        {!loading && notifications.map((rev) => (
          <button
            key={rev.id}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border last:border-0"
            onClick={() => {
              navigate(`/projects/${rev.submission.project.id}`);
              onClose();
            }}
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{rev.submission.title}</p>
              <p className="text-xs text-muted-foreground truncate">{rev.submission.project.title}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-2">{rev.feedback}</p>
              <p className="text-xs text-muted-foreground mt-1">
                by {rev.createdBy?.name} · {timeAgo(rev.createdAt)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Profile dialog ─────────────────────────────────────────────────
function ProfileDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const profileForm = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  });

  const passwordForm = useForm({
    defaultValues: { password: '', confirm: '' },
  });

  const saveProfile = async (data) => {
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, { name: data.name, email: data.email });
      toast.success('Profile updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (data) => {
    if (data.password !== data.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, { password: data.password });
      toast.success('Password updated');
      passwordForm.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="My Profile">
        <div className="flex gap-1 rounded-lg bg-muted p-1 mb-4">
          <button
            onClick={() => setTab('profile')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'profile' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="h-3.5 w-3.5" /> Profile
          </button>
          <button
            onClick={() => setTab('password')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'password' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <KeyRound className="h-3.5 w-3.5" /> Password
          </button>
        </div>

        {tab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
            <div className="flex justify-center mb-2">
              <Avatar name={user?.name} size="xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input {...profileForm.register('name', { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...profileForm.register('email', { required: true })} />
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Role: <span className="font-medium text-foreground">{user?.role}</span>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(savePassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password" placeholder="Min 8 characters"
                {...passwordForm.register('password', { required: true, minLength: { value: 8, message: 'Min 8 characters' } })}
              />
              {passwordForm.formState.errors.password && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Repeat new password" {...passwordForm.register('confirm', { required: true })} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── TopBar ─────────────────────────────────────────────────────────────────
export function TopBar({ onMobileMenuToggle }) {
  const { user } = useAuth();
  const location = useLocation();
  const { notifications } = useNotifications();
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef(null);

  const basePath = '/' + location.pathname.split('/')[1];
  const breadcrumbs = BREADCRUMBS[basePath] || [{ label: 'Page' }];

  // Close bell dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const unreadCount = notifications.length;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0">
      {/* Mobile menu */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-accent"
        onClick={onMobileMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1">
        <h1 className="text-base font-semibold">
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="text-muted-foreground mx-1">/</span>}
              <span>{b.label}</span>
            </span>
          ))}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {/* Bell with badge */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {bellOpen && (
            <NotificationsDropdown onClose={() => setBellOpen(false)} />
          )}
        </div>

        {/* User avatar */}
        {user && (
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
            aria-label="Edit profile"
          >
            <Avatar name={user.name} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.role}</p>
            </div>
          </button>
        )}
      </div>

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
