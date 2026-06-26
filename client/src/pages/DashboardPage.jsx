import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  AlertTriangle, CheckCircle2, Clock, FolderKanban,
  TrendingUp, AlertCircle, Calendar, ChevronDown, ChevronUp, Filter, X, Users
} from 'lucide-react';
import api from '../lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { STATUS_CONFIG, PROJECT_STATUS_CONFIG, formatDate, isOverdue, cn } from '../lib/utils';

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <Card className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
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

const CHART_COLORS = {
  ACTIVE: '#6366f1', DRAFT: '#94a3b8', COMPLETED: '#10b981',
  ON_HOLD: '#f59e0b', CANCELLED: '#ef4444', ARCHIVED: '#64748b',
};

// Calculate days elapsed since startDate
function daysElapsed(startDate) {
  if (!startDate) return null;
  const diff = Date.now() - new Date(startDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Calculate days remaining until deadline
function daysRemaining(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function OngoingProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false);
  const elapsed = daysElapsed(project.startDate);
  const remaining = daysRemaining(project.deadline);
  const overdue = remaining !== null && remaining < 0;
  const statusCfg = PROJECT_STATUS_CONFIG[project.status];

  const submissionCounts = project.submissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <Link
              to={`/projects/${project.id}`}
              className="font-semibold text-base hover:text-primary transition-colors line-clamp-1"
            >
              {project.title}
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {statusCfg && (
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusCfg.color)}>
                  {statusCfg.label}
                </span>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Avatar name={project.pic?.name} size="xs" />
                <span>{project.pic?.name}</span>
                {project.pic?.divisions?.map((ud) => (
                  <span key={ud.division?.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {ud.division?.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold">{Math.round(project.progressTotal)}%</p>
            <p className="text-xs text-muted-foreground">overall</p>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar value={project.progressTotal} size="md" className="mb-4" />

        {/* Time info */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Elapsed</p>
            <p className="text-sm font-semibold">
              {elapsed !== null ? `${elapsed}d` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
            <p className="text-sm font-semibold truncate">{formatDate(project.deadline)}</p>
          </div>
          <div className={cn('rounded-lg px-3 py-2 text-center', overdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted/50')}>
            <p className="text-xs text-muted-foreground mb-0.5">Remaining</p>
            <p className={cn('text-sm font-semibold', overdue && 'text-red-600 dark:text-red-400')}>
              {remaining !== null ? (overdue ? `${Math.abs(remaining)}d over` : `${remaining}d`) : '—'}
            </p>
          </div>
        </div>

        {/* Submission summary */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(submissionCounts).map(([status, count]) => (
              <span
                key={status}
                className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CONFIG[status]?.color)}
              >
                {STATUS_CONFIG[status]?.label || status} {count}
              </span>
            ))}
            {project.submissions.length === 0 && (
              <span className="text-xs text-muted-foreground">No submissions yet</span>
            )}
          </div>
          {project.submissions.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Hide' : 'Show'} submissions
            </button>
          )}
        </div>

        {/* Submission list */}
        {expanded && project.submissions.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            {project.submissions.map((sub) => {
              const subOverdue = isOverdue(sub.deadline) && !['APPROVED', 'DONE'].includes(sub.status);
              const subProgress = ['APPROVED', 'DONE'].includes(sub.status) ? 100 : sub.progress;
              return (
                <div key={sub.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium truncate">{sub.title}</span>
                      <span className={cn(
                        'inline-flex items-center rounded-full px-1.5 py-0 text-xs font-medium shrink-0',
                        STATUS_CONFIG[sub.status]?.color
                      )}>
                        {STATUS_CONFIG[sub.status]?.label || sub.status}
                      </span>
                    </div>
                    <ProgressBar value={subProgress} size="sm" />
                  </div>
                  <div className="shrink-0 text-right min-w-[60px]">
                    <p className="text-xs font-semibold">{subProgress}%</p>
                    {sub.deadline && (
                      <p className={cn('text-xs', subOverdue ? 'text-red-500' : 'text-muted-foreground')}>
                        {formatDate(sub.deadline)}
                      </p>
                    )}
                  </div>
                  {sub.assignedUser && <Avatar name={sub.assignedUser.name} size="xs" />}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContributorRow({ contributor: c, rank, maxCount }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      {/* Row header — clickable */}
      <button
        className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs text-muted-foreground w-4 shrink-0">{rank}</span>
        <Avatar name={c.user.name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="min-w-0">
              <span className="text-sm font-medium">{c.user.name}</span>
              {c.user.divisions?.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {c.user.divisions.map(d => d.division?.name).filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-sm font-semibold">{c.count}</span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(c.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      </button>

      {/* Expanded submission list */}
      {expanded && c.submissions?.length > 0 && (
        <div className="mt-3 ml-7 space-y-2">
          {c.submissions.map((sub) => {
            const subOverdue = isOverdue(sub.deadline) && !['APPROVED', 'DONE'].includes(sub.status);
            const progress = ['APPROVED', 'DONE'].includes(sub.status) ? 100 : sub.progress;
            return (
              <Link
                key={sub.id}
                to={`/projects/${sub.project.id}`}
                className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium truncate">{sub.title}</span>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-1.5 py-0 text-xs font-medium shrink-0',
                      STATUS_CONFIG[sub.status]?.color
                    )}>
                      {STATUS_CONFIG[sub.status]?.label || sub.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={progress} size="sm" className="flex-1" />
                    <span className="text-xs font-medium w-8 text-right shrink-0">{progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub.project.title}</p>
                </div>
                {sub.deadline && (
                  <span className={cn('text-xs shrink-0', subOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                    {formatDate(sub.deadline)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Submission Timeline (Gantt) ────────────────────────────────────────────────
const STATUS_BAR_COLOR = {
  TODO:        '#94a3b8',
  IN_PROGRESS: '#6366f1',
  SUBMITTED:   '#818cf8',
  REVISION:    '#f59e0b',
  RESUBMITTED: '#a78bfa',
  APPROVED:    '#10b981',
  DONE:        '#10b981',
  ON_HOLD:     '#64748b',
};

function SubmissionTimeline({ divisionId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = divisionId ? { divisionId } : {};
    api.get('/reports/timeline', { params })
      .then((res) => setRows(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [divisionId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <Skeleton className="h-6 w-24 shrink-0" />
            <Skeleton className="h-6 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Users className="h-10 w-10 opacity-20 mb-3" />
        <p className="text-sm">No active submissions assigned</p>
      </div>
    );
  }

  // Compute global date range
  const allSubmissions = rows.flatMap((r) => r.submissions);
  const allDates = allSubmissions.flatMap((s) => [
    s.createdAt ? new Date(s.createdAt) : null,
    s.deadline ? new Date(s.deadline) : null,
    ...s.revisions.map((r) => new Date(r.createdAt)),
  ]).filter(Boolean);

  const now = new Date();
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime()), now.getTime()));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime()), now.getTime()));
  const totalMs = maxDate.getTime() - minDate.getTime() || 86400000;
  const padMs = totalMs * 0.05;
  const rangeStart = new Date(minDate.getTime() - padMs);
  const rangeEnd = new Date(maxDate.getTime() + padMs);
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();

  const toPercent = (date) => {
    if (!date) return null;
    return ((new Date(date).getTime() - rangeStart.getTime()) / rangeMs) * 100;
  };

  const nowPct = toPercent(now);

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(rangeStart.getTime() + (rangeMs * i) / 4);
    return { pct: (i / 4) * 100, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
  });

  return (
    <div className="relative select-none">
      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg border border-border bg-card shadow-xl px-3 py-2 text-xs pointer-events-none max-w-xs"
          style={{ left: tooltip.x + 14, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Date axis */}
      <div className="flex mb-3 pl-32">
        <div className="relative flex-1 h-5">
          {ticks.map((t, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
              style={{ left: `${t.pct}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Person rows */}
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.user.id}>
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={row.user.name} size="sm" />
              <span className="text-sm font-semibold">{row.user.name}</span>
              <span className="text-xs text-muted-foreground">
                ({row.submissions.length} submission{row.submissions.length !== 1 ? 's' : ''})
              </span>
            </div>

            <div className="space-y-1.5">
              {row.submissions.map((sub) => {
                const startPct = Math.max(0, toPercent(sub.createdAt) ?? 0);
                const endPct = toPercent(sub.deadline);
                const barRight = endPct !== null ? Math.min(100, endPct) : Math.min(100, (toPercent(now) ?? 0) + 2);
                const barWidth = Math.max(barRight - startPct, 0.5);
                const isOver = sub.deadline && new Date(sub.deadline) < now && !['APPROVED', 'DONE'].includes(sub.status);
                const barColor = isOver ? '#ef4444' : (STATUS_BAR_COLOR[sub.status] || '#6366f1');

                return (
                  <div key={sub.id} className="flex items-center gap-2">
                    {/* Row label */}
                    <div className="w-28 shrink-0 text-right pr-2">
                      <span className="text-xs text-muted-foreground truncate block" title={sub.title}>
                        {sub.title.length > 14 ? sub.title.slice(0, 14) + '…' : sub.title}
                      </span>
                    </div>

                    {/* Bar track */}
                    <div className="relative flex-1 rounded-full bg-muted" style={{ height: 20 }}>
                      {/* Today line */}
                      {nowPct !== null && nowPct >= 0 && nowPct <= 100 && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                          style={{ left: `${nowPct}%` }}
                        />
                      )}

                      {/* Submission bar */}
                      <div
                        className="absolute top-1 bottom-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ left: `${startPct}%`, width: `${barWidth}%`, backgroundColor: barColor }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            x: rect.right,
                            y: rect.top,
                            content: (
                              <div className="space-y-1">
                                <p className="font-semibold">{sub.title}</p>
                                <p className="text-muted-foreground">{sub.project.title}</p>
                                <p>Status: <span className="font-medium">{STATUS_CONFIG[sub.status]?.label || sub.status}</span></p>
                                <p>Progress: <span className="font-medium">{sub.progress}%</span></p>
                                {sub.deadline && (
                                  <p>Deadline: <span className={cn('font-medium', isOver && 'text-red-500')}>{formatDate(sub.deadline)}</span></p>
                                )}
                                {sub.revisions.length > 0 && (
                                  <p>Revisions: <span className="font-medium text-amber-500">{sub.revisions.length}</span></p>
                                )}
                              </div>
                            ),
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {/* Progress overlay */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-white/25"
                          style={{ width: `${sub.progress}%` }}
                        />
                      </div>

                      {/* Revision diamonds */}
                      {sub.revisions.map((rev) => {
                        const revPct = toPercent(rev.createdAt);
                        if (revPct === null || revPct < 0 || revPct > 100) return null;
                        return (
                          <div
                            key={rev.id}
                            className="absolute z-20 cursor-pointer"
                            style={{
                              left: `${revPct}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%) rotate(45deg)',
                              width: 10,
                              height: 10,
                              backgroundColor: rev.status === 'RESOLVED' ? '#3b82f6' : '#f59e0b',
                              border: '2px solid white',
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                x: rect.right,
                                y: rect.top,
                                content: (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-amber-600">Revision #{rev.revisionNumber}</p>
                                    <p className="text-muted-foreground">{formatDate(rev.createdAt)}</p>
                                    <p className="line-clamp-3">{rev.feedback}</p>
                                  </div>
                                ),
                              });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        );
                      })}

                      {/* Deadline marker */}
                      {endPct !== null && endPct >= 0 && endPct <= 100 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 z-10 rounded"
                          style={{ left: `${endPct}%`, backgroundColor: isOver ? '#ef4444' : '#64748b' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border">
        {[
          { color: '#6366f1', label: 'In Progress' },
          { color: '#10b981', label: 'Approved/Done' },
          { color: '#ef4444', label: 'Overdue' },
          { color: '#94a3b8', label: 'Todo / On Hold' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 shrink-0 rotate-45 border-2 border-white" style={{ backgroundColor: '#f59e0b' }} />
          Revision (open)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2.5 h-2.5 shrink-0 rotate-45 border-2 border-white" style={{ backgroundColor: '#3b82f6' }} />
          Revision (resolved)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-px h-3 shrink-0 bg-red-400" />
          Today
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [divisions, setDivisions] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', divisionId: '' });

  const fetchData = (f = filters) => {
    setLoading(true);
    const params = {};
    if (f.dateFrom) params.dateFrom = f.dateFrom;
    if (f.dateTo) params.dateTo = f.dateTo;
    if (f.divisionId) params.divisionId = f.divisionId;
    api.get('/reports/summary', { params })
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    api.get('/divisions').then((res) => setDivisions(res.data.data)).catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchData(next);
  };

  const clearFilters = () => {
    const empty = { dateFrom: '', dateTo: '', divisionId: '' };
    setFilters(empty);
    fetchData(empty);
  };

  const hasFilters = filters.dateFrom || filters.dateTo || filters.divisionId;

  const stats = data?.stats;
  const chartData = data?.projects?.map((p) => ({
    name: p.title.length > 18 ? p.title.slice(0, 18) + '...' : p.title,
    progress: Math.round(p.progressTotal),
    status: p.status,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Overview of all projects and submissions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-36 text-sm"
            title="From date"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-36 text-sm"
            title="To date"
          />
          <Select
            value={filters.divisionId}
            onChange={(e) => handleFilterChange('divisionId', e.target.value)}
            className="w-40 text-sm"
          >
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs gap-1">
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Projects" value={stats?.activeProjects ?? '-'} icon={FolderKanban}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" loading={loading} />
        <StatCard title="In Progress" value={stats?.inProgressSubmissions ?? '-'} icon={TrendingUp}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" loading={loading} />
        <StatCard title="Need Revision" value={stats?.needRevision ?? '-'} icon={AlertCircle}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" loading={loading} />
        <StatCard title="Overdue" value={stats?.overdue ?? '-'} icon={AlertTriangle}
          color="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" loading={loading} />
      </div>

      {/* Ongoing Projects */}
      <div>
        <h3 className="text-base font-semibold mb-3">
          Ongoing Projects
          {data?.ongoingProjects && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({data.ongoingProjects.length})
            </span>
          )}
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
          </div>
        ) : data?.ongoingProjects?.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <FolderKanban className="h-10 w-10 mx-auto opacity-20 mb-3" />
              <p className="text-sm text-muted-foreground">No active projects</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.ongoingProjects.map((p) => (
              <OngoingProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
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
                  <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
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

      {/* Submission Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Submission Timeline by Person
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionTimeline divisionId={filters.divisionId} />
        </CardContent>
      </Card>

      {/* Contributors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Submission Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : !data?.contributors?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No submission data yet</p>
          ) : (
            <div className="divide-y divide-border">
              {data.contributors.map((c, i) => (
                <ContributorRow key={c.user.id} contributor={c} rank={i + 1} maxCount={data.contributors[0]?.count || 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
