import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FolderOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/Dialog';
import { ProjectForm } from '../components/project/ProjectForm';
import { PROJECT_STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue, cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { isAdminOrManager } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { projects, loading, refetch } = useProjects({
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(priorityFilter && { priority: priorityFilter }),
  });

  const handleCreateSuccess = () => {
    setCreateOpen(false);
    refetch();
    toast.success('Project created successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? '...' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdminOrManager && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent title="Create Project" description="Fill in the details to create a new project.">
              <ProjectForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-36">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-muted-foreground font-medium">Project</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">PIC</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Deadline</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Progress</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-4 py-4 hidden md:table-cell"><Skeleton className="h-8 w-8 rounded-full" /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-2.5 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-8" /></td>
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <FolderOpen className="h-12 w-12 opacity-30" />
                      <p className="font-medium">No projects found</p>
                      <p className="text-sm">Try adjusting your filters or create a new project</p>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => {
                  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
                  const priorityCfg = PRIORITY_CONFIG[project.priority];
                  const overdue = isOverdue(project.deadline) && !['COMPLETED', 'ARCHIVED', 'CANCELLED'].includes(project.status);

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-accent/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className={cn('text-xs mt-0.5', priorityCfg?.color)}>
                            {priorityCfg?.label} priority
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={project.pic?.name} size="sm" />
                          <span className="text-xs text-muted-foreground hidden lg:block">{project.pic?.name}</span>
                        </div>
                      </td>
                      <td className={cn('px-4 py-4 hidden lg:table-cell text-sm', overdue && 'text-red-500 font-medium')}>
                        {formatDate(project.deadline)}
                        {overdue && <span className="ml-1 text-xs">(overdue)</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <ProgressBar value={project.progressTotal} showLabel size="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusCfg?.color
                        )}>
                          {statusCfg?.label || project.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell text-muted-foreground">
                        {project._count?.submissions ?? 0}
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
