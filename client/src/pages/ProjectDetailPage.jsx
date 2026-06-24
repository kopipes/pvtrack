import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit, Download, LayoutList, Kanban,
  Calendar, User, AlertTriangle
} from 'lucide-react';
import { useProject } from '../hooks/useProjects';
import { useSubmissions } from '../hooks/useSubmissions';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/Dialog';
import { Skeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SubmissionCard } from '../components/submission/SubmissionCard';
import { SubmissionForm } from '../components/submission/SubmissionForm';
import { ProjectForm } from '../components/project/ProjectForm';
import { SubmissionSlideOver } from '../components/submission/SubmissionSlideOver';
import { BoardView } from '../components/submission/BoardView';
import { PROJECT_STATUS_CONFIG, PRIORITY_CONFIG, formatDate, isOverdue, cn } from '../lib/utils';
import { toast } from 'sonner';
import api from '../lib/axios';

// Circular SVG progress ring
function CircularProgress({ value, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} className="stroke-muted fill-none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={8}
        fill="none"
        className="stroke-primary transition-all duration-500"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        className="fill-foreground text-xs font-bold rotate-90"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
        style={{ fontSize: 13 }}
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdminOrManager, canWrite } = useAuth();
  const { project, loading: projectLoading, refetch: refetchProject } = useProject(id);
  const { submissions, loading: subsLoading, refetch: refetchSubmissions } = useSubmissions(id);

  const [view, setView] = useState('list'); // 'list' | 'board'
  const [createOpen, setCreateOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [slideOpen, setSlideOpen] = useState(false);

  const handleCardClick = (subId) => {
    setSelectedSubId(subId);
    setSlideOpen(true);
  };

  const handleSubCreated = () => {
    setCreateOpen(false);
    refetchSubmissions();
    refetchProject();
    toast.success('Submission created');
  };

  const handleSubUpdated = () => {
    refetchSubmissions();
    refetchProject();
  };

  const handleProjectUpdated = () => {
    setEditProjectOpen(false);
    refetchProject();
    toast.success('Project updated');
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/reports/export/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project?.title || 'project'}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const statusCfg = PROJECT_STATUS_CONFIG[project?.status];
  const priorityCfg = PRIORITY_CONFIG[project?.priority];
  const overdue = project && isOverdue(project.deadline) && !['COMPLETED', 'ARCHIVED', 'CANCELLED'].includes(project.status);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="-ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Button>

      {/* Project Header */}
      {projectLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : project ? (
        <Card className="overflow-hidden">
          {/* Gradient header stripe */}
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{project.title}</h2>
                  {statusCfg && (
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusCfg.color)}>
                      {statusCfg.label}
                    </span>
                  )}
                  {priorityCfg && (
                    <span className={cn('text-xs font-medium', priorityCfg.color)}>
                      {priorityCfg.label} priority
                    </span>
                  )}
                  {overdue && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-500">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </span>
                  )}
                </div>

                {project.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{project.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Avatar name={project.pic?.name} size="xs" />
                    <span>{project.pic?.name}</span>
                  </div>
                  <div className={cn('flex items-center gap-2', overdue && 'text-red-500')}>
                    <Calendar className="h-4 w-4" />
                    <span>Deadline: {formatDate(project.deadline)}</span>
                  </div>
                  {project.startDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Start: {formatDate(project.startDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Circular progress */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <CircularProgress value={project.progressTotal} />
                <span className="text-xs text-muted-foreground">Overall</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        {canWrite && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Create Submission
              </Button>
            </DialogTrigger>
            <DialogContent title="Create Submission" description="Add a new submission card to this project.">
              <SubmissionForm
                projectId={id}
                members={project?.members || []}
                onSuccess={handleSubCreated}
              />
            </DialogContent>
          </Dialog>
        )}

        {isAdminOrManager && (
          <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4" />
                Edit Project
              </Button>
            </DialogTrigger>
            <DialogContent title="Edit Project" description="Update project details.">
              {project && (
                <ProjectForm project={project} onSuccess={handleProjectUpdated} />
              )}
            </DialogContent>
          </Dialog>
        )}

        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>

        {/* View toggle */}
        <div className="ml-auto flex items-center rounded-lg border border-border p-1 gap-1">
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutList className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView('board')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'board' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Kanban className="h-3.5 w-3.5" /> Board
          </button>
        </div>
      </div>

      {/* Submissions */}
      {subsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Kanban className="h-12 w-12 opacity-30" />
              <p className="font-medium">No submissions yet</p>
              <p className="text-sm">Create the first submission card for this project</p>
            </div>
          </CardContent>
        </Card>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              onClick={() => handleCardClick(sub.id)}
            />
          ))}
        </div>
      ) : (
        <BoardView
          submissions={submissions}
          onCardClick={handleCardClick}
          onUpdate={handleSubUpdated}
        />
      )}

      {/* Submission slide-over */}
      <SubmissionSlideOver
        submissionId={selectedSubId}
        open={slideOpen}
        onOpenChange={setSlideOpen}
        members={project?.members || []}
        onUpdate={handleSubUpdated}
      />
    </div>
  );
}
