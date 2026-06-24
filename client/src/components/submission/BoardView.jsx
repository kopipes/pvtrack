import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../contexts/AuthContext';
import { SubmissionCard } from './SubmissionCard';
import { cn, STATUS_CONFIG } from '../../lib/utils';
import api from '../../lib/axios';
import { toast } from 'sonner';

const COLUMNS = [
  'TODO',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISION',
  'RESUBMITTED',
  'APPROVED',
  'DONE',
  'ON_HOLD',
];

function SortableSubmissionCard({ submission, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: submission.id,
    data: { submission },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SubmissionCard submission={submission} onClick={onClick} />
    </div>
  );
}

export function BoardView({ submissions, onCardClick, onUpdate }) {
  const { canWrite } = useAuth();
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col] = submissions.filter((s) => s.status === col);
    return acc;
  }, {});

  const activeSubmission = activeId ? submissions.find((s) => s.id === activeId) : null;

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || !canWrite) return;

    const draggedSubmission = submissions.find((s) => s.id === active.id);
    if (!draggedSubmission) return;

    // Determine target column — over could be a column id or a card id
    let targetStatus = over.id;
    if (!COLUMNS.includes(targetStatus)) {
      const overSub = submissions.find((s) => s.id === over.id);
      targetStatus = overSub?.status;
    }

    if (!targetStatus || targetStatus === draggedSubmission.status) return;

    try {
      await api.patch(`/submissions/${draggedSubmission.id}/status`, { status: targetStatus });
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((colStatus) => {
          const colSubmissions = grouped[colStatus] || [];
          const statusCfg = STATUS_CONFIG[colStatus];

          return (
            <div key={colStatus} className="flex flex-col shrink-0 w-64">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusCfg?.color
                )}>
                  {statusCfg?.label || colStatus}
                </span>
                <span className="text-xs text-muted-foreground font-medium">{colSubmissions.length}</span>
              </div>

              {/* Drop zone */}
              <SortableContext
                id={colStatus}
                items={colSubmissions.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  className={cn(
                    'flex flex-col gap-3 min-h-32 rounded-xl p-3',
                    'bg-muted/40 dark:bg-white/5 border border-dashed border-border',
                    'transition-colors'
                  )}
                  data-column={colStatus}
                >
                  {colSubmissions.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Empty</p>
                  )}
                  {colSubmissions.map((sub) => (
                    <SortableSubmissionCard
                      key={sub.id}
                      submission={sub}
                      onClick={() => onCardClick(sub.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeSubmission && (
          <div className="opacity-90 rotate-1 scale-105">
            <SubmissionCard submission={activeSubmission} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
