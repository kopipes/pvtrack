import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
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

// Which columns a USER role can drag to
const USER_ALLOWED_TRANSITIONS = {
  TODO:        ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['TODO', 'ON_HOLD'],
  REVISION:    ['IN_PROGRESS'],
  RESUBMITTED: ['IN_PROGRESS'],
  ON_HOLD:     ['TODO', 'IN_PROGRESS'],
  // SUBMITTED / APPROVED / DONE — user cannot drag away from these
};

// Which columns ADMIN/MANAGER can drag to (broader)
const MANAGER_ALLOWED_TRANSITIONS = {
  TODO:        ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['TODO', 'SUBMITTED', 'ON_HOLD'],
  SUBMITTED:   ['APPROVED', 'REVISION', 'IN_PROGRESS'],
  REVISION:    ['IN_PROGRESS'],
  RESUBMITTED: ['APPROVED', 'REVISION', 'IN_PROGRESS'],
  APPROVED:    ['DONE'],
  DONE:        [],
  ON_HOLD:     ['TODO', 'IN_PROGRESS'],
};

function canTransition(from, to, isAdminOrManager) {
  if (from === to) return false;
  const map = isAdminOrManager ? MANAGER_ALLOWED_TRANSITIONS : USER_ALLOWED_TRANSITIONS;
  return (map[from] || []).includes(to);
}

function SortableSubmissionCard({ submission, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: submission.id,
    data: { type: 'card', columnId: submission.status },
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

// Separate droppable column container
function DroppableColumn({ colStatus, colSubmissions, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${colStatus}`,
    data: { type: 'column', columnId: colStatus },
  });

  const statusCfg = STATUS_CONFIG[colStatus];

  return (
    <div className="flex flex-col shrink-0 w-64">
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
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-3 min-h-32 rounded-xl p-3 transition-colors',
            'bg-muted/40 dark:bg-white/5 border border-dashed border-border',
            isOver && 'border-primary bg-primary/5'
          )}
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
}

export function BoardView({ submissions, onCardClick, onUpdate }) {
  const { canWrite, isAdminOrManager } = useAuth();
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

    // Resolve the target column:
    // - If dropped on a column droppable: use its columnId
    // - If dropped on a card: use that card's current status (same column reorder)
    let targetStatus;
    if (over.data.current?.type === 'column') {
      targetStatus = over.data.current.columnId;
    } else if (over.data.current?.type === 'card') {
      targetStatus = over.data.current.columnId;
    } else {
      // Fallback: strip 'col-' prefix if present
      const overId = String(over.id);
      targetStatus = overId.startsWith('col-') ? overId.replace('col-', '') : draggedSubmission.status;
    }

    // Same column — nothing to do
    if (!targetStatus || targetStatus === draggedSubmission.status) return;

    // Enforce transition rules
    if (!canTransition(draggedSubmission.status, targetStatus, isAdminOrManager)) {
      toast.error(`Cannot move from ${STATUS_CONFIG[draggedSubmission.status]?.label} to ${STATUS_CONFIG[targetStatus]?.label}`);
      return;
    }

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
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((colStatus) => (
          <DroppableColumn
            key={colStatus}
            colStatus={colStatus}
            colSubmissions={grouped[colStatus] || []}
            onCardClick={onCardClick}
          />
        ))}
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
