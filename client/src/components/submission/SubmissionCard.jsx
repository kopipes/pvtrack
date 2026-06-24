import { MessageSquare, RotateCcw, CheckSquare, Clock, User } from 'lucide-react';
import { cn, STATUS_CONFIG, formatDate, isOverdue } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { ProgressBar } from '../ui/ProgressBar';

export function SubmissionCard({ submission, onClick }) {
  const { title, status, deadline, assignedUser, _count } = submission;
  const isLocked = ['APPROVED', 'DONE'].includes(status);
  const progress = isLocked ? 100 : submission.progress;
  const statusCfg = STATUS_CONFIG[status];
  const overdue = isOverdue(deadline) && !isLocked;
  const completedChecklist = submission.checklistItems?.filter((c) => c.isCompleted).length ?? 0;
  const totalChecklist = _count?.checklistItems ?? submission.checklistItems?.length ?? 0;

  return (
    <div
      className={cn(
        'group rounded-xl border border-border bg-card p-4 cursor-pointer',
        'hover:-translate-y-1 hover:shadow-xl transition-all duration-200',
        'dark:bg-white/5 dark:backdrop-blur dark:border-white/10'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`Open submission: ${title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 flex-1">{title}</h3>
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
          statusCfg?.color
        )}>
          {statusCfg?.label || status}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <ProgressBar value={progress} showLabel size="sm" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Checklist badge */}
          {totalChecklist > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckSquare className="h-3.5 w-3.5" />
              {completedChecklist}/{totalChecklist}
            </span>
          )}
          {/* Notes badge */}
          {(_count?.notes ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {_count.notes}
            </span>
          )}
          {/* Revisions badge */}
          {(_count?.revisions ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <RotateCcw className="h-3.5 w-3.5" />
              {_count.revisions}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Deadline chip */}
          {deadline && (
            <span className={cn(
              'flex items-center gap-1 text-xs rounded-full px-2 py-0.5',
              overdue
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-muted text-muted-foreground'
            )}>
              <Clock className="h-3 w-3" />
              {formatDate(deadline)}
            </span>
          )}
          {/* Assigned user */}
          {assignedUser && <Avatar name={assignedUser.name} size="xs" />}
        </div>
      </div>
    </div>
  );
}
