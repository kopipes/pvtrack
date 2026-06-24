import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, FolderKanban,
  TrendingUp, AlertCircle, Calendar
} from 'lucide-react';
import api from '../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { STATUS_CONFIG, PROJECT_STATUS_CONFIG, formatDate, isOverdue, cn } from '../lib/utils';

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <Card className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{title}</p>
              </>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = {
  ACTIVE: '#6366f1',
  DRAFT: '#94a3b8',
  COMPLETED: '#10b981',
  ON_HOLD: '#f59e0b',
  CANCELLED: '#ef4444',
  ARCHIVED: '#64748b',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/summary')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const chartData = data?.projects?.map((p) => ({
    name: p.title.length > 18 ? p.title.slice(0, 18) + '...' : p.title,
    progress: Math.round(p.progressTotal),
    status: p.status,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Overview of all projects and submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects ?? '-'}
          icon={FolderKanban}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
          loading={loading}
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressSubmissions ?? '-'}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title="Need Revision"
          value={stats?.needRevision ?? '-'}
          icon={AlertCircle}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          loading={loading}
        />
        <StatCard
          title="Overdue"
          value={stats?.overdue ?? '-'}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Progress chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-muted-foreground text-sm">
                No project data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Progress']}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={CHART_COLORS[entry.status] || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Deadlines this week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadlines This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : data?.deadlinesThisWeek?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deadlines this week</p>
            ) : (
              data?.deadlinesThisWeek?.map((s) => (
                <Link
                  key={s.id}
                  to={`/projects/${s.project.id}`}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                >
                  <div className="mt-0.5">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.project.title}</p>
                  </div>
                  <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                    {formatDate(s.deadline)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Need attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Need Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : data?.needAttention?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
              <p className="text-sm">All clear — nothing needs attention right now</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data?.needAttention?.map((s) => (
                <Link
                  key={s.id}
                  to={`/projects/${s.project.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-accent/50 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{s.title}</span>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                        STATUS_CONFIG[s.status]?.color
                      )}>
                        {STATUS_CONFIG[s.status]?.label || s.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.project.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {s.assignedUser && <Avatar name={s.assignedUser.name} size="sm" />}
                  </div>
                  {s.deadline && (
                    <span className={cn(
                      'text-xs shrink-0',
                      isOverdue(s.deadline) ? 'text-red-500 font-medium' : 'text-muted-foreground'
                    )}>
                      {formatDate(s.deadline)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
