import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, BarChart3, LogOut,
  Sun, Moon, ChevronLeft, ChevronRight, Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/master-data', icon: Database, label: 'Master Data' },
];

function SidebarItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        cn(
          'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
          'hover:bg-accent hover:text-accent-foreground',
          collapsed
            ? 'h-10 w-10 justify-center mx-auto'
            : 'gap-3 px-3 py-2.5',
          isActive
            ? collapsed
              ? 'bg-primary/10 text-primary'
              : 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
            : 'text-muted-foreground'
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300 shrink-0 overflow-hidden',
        collapsed ? 'w-[60px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-border shrink-0',
        collapsed ? 'justify-center' : 'px-4 gap-3'
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <span className="text-primary-foreground font-bold text-sm">PV</span>
        </div>
        {!collapsed && <span className="font-bold text-lg tracking-tight">PVTrack</span>}
      </div>

      {/* Nav links */}
      <nav className={cn('flex-1 py-3 overflow-y-auto', collapsed ? 'px-[10px] space-y-1' : 'px-2 space-y-1')}>
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className={cn('border-t border-border py-3 shrink-0', collapsed ? 'px-[10px] space-y-1' : 'px-2 space-y-1')}>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          className={cn(
            'flex items-center text-sm text-muted-foreground rounded-lg transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            collapsed ? 'h-10 w-10 justify-center mx-auto' : 'w-full gap-3 px-3 py-2'
          )}
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User */}
        {user && (
          <div
            title={`${user.name} (${user.role})`}
            className={cn(
              'flex items-center rounded-lg',
              collapsed ? 'h-10 w-10 justify-center mx-auto' : 'gap-2 px-3 py-2'
            )}
          >
            <Avatar name={user.name} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.role}</p>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            'flex items-center text-sm text-muted-foreground rounded-lg transition-colors',
            'hover:bg-destructive/10 hover:text-destructive',
            collapsed ? 'h-10 w-10 justify-center mx-auto' : 'w-full gap-3 px-3 py-2'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={cn(
            'flex items-center text-xs text-muted-foreground rounded-lg transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            collapsed ? 'h-10 w-10 justify-center mx-auto' : 'w-full gap-3 px-3 py-2'
          )}
        >
          {collapsed
            ? <ChevronRight className="h-[18px] w-[18px] shrink-0" />
            : <><ChevronLeft className="h-[18px] w-[18px] shrink-0" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
