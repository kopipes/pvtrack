import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const BREADCRUMBS = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/projects': [{ label: 'Projects' }],
  '/reports': [{ label: 'Reports' }],
};

export function TopBar({ onMobileMenuToggle }) {
  const { user } = useAuth();
  const location = useLocation();

  const basePath = '/' + location.pathname.split('/')[1];
  const breadcrumbs = BREADCRUMBS[basePath] || [{ label: 'Page' }];

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

      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        {user && <Avatar name={user.name} size="sm" />}
      </div>
    </header>
  );
}
