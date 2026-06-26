import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, BarChart3, FolderKanban, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
import api from '../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { PROJECT_STATUS_CONFIG, STATUS_CONFIG, formatDate, cn } from '../lib/utils';
import { toast } from 'sonner';

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            {loading ? (
              <><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-4 w-24" /></>
            ) : (
              <><p className="text-3xl font-bold">{value}</p><p className="text-sm text-muted-foreground mt-1">{title}</p></>
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

export default function ReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/reports/summary');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load report summary:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = async (projectId, projectTitle) => {
    try {
      const res = await api.get(`/reports/export/${projectId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectTitle}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground text-sm mt-1">Summary and per-project breakdown</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={stats?.totalProjects ?? '-'} icon={FolderKanban}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" loading={loading} />
        <StatCard title="Total Submissions" value={stats?.totalSubmissions ?? '-'} icon={TrendingUp}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" loading={loading} />
        <StatCard title="Need Revision" value={stats?.needRevision ?? '-'} icon={AlertCircle}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" loading={loading} />
        <StatCard title="Overdue" value={stats?.overdue ?? '-'} icon={AlertTriangle}
          color="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" loading={loading} />
      </div>

      {/* Projects table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            All Projects
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Project</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">PIC</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Progress</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Deadline</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Submissions</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-4 py-4 hidden md:table-cell"><Skeleton className="h-8 w-8 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-2.5 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-7 w-16" /></td>
                  </tr>
                ))
              ) : data?.projects?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-sm">
                    No projects yet
                  </td>
                </tr>
              ) : (
                data?.projects?.map((project) => {
                  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
                  return (
                    <tr key={project.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/projects/${project.id}`} className="font-medium hover:text-primary transition-colors">
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={project.pic?.name} size="sm" />
                          <span className="text-xs text-muted-foreground hidden lg:block">{project.pic?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <ProgressBar value={project.progressTotal} showLabel size="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {statusCfg && (
                          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.color)}>
                            {statusCfg.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {formatDate(project.deadline)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground hidden sm:table-cell">
                        {project._count?.submissions ?? 0}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExport(project.id, project.title)}
                          className="text-xs"
                        >
                          <Download className="h-3 w-3" />
                          CSV
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
