import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="text-2xl font-black">PV</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-3">PVTrack</h1>
            <p className="text-indigo-200 text-lg leading-relaxed">
              Project and submission tracking for modern teams. Manage your work, track progress, and deliver on time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Projects', value: 'Tracked' },
              { label: 'Submissions', value: 'Managed' },
              { label: 'Revisions', value: 'Logged' },
              { label: 'Team', value: 'Aligned' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/10 p-4">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-indigo-200 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-primary-foreground font-bold">PV</span>
            </div>
            <span className="text-xl font-bold">PVTrack</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
                })}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Demo accounts (password: password123)</p>
            {[
              { email: 'admin@pvtrack.com', role: 'Admin' },
              { email: 'manager@pvtrack.com', role: 'Manager' },
              { email: 'alex@pvtrack.com', role: 'User' },
            ].map(({ email, role }) => (
              <p key={email} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{role}:</span> {email}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
