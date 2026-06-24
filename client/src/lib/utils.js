import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date, options = {}) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
}

// Check if a date is past
export function isOverdue(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

// Relative time (e.g. "3 days ago")
export function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

// Generate a deterministic color from a string (for avatar)
export function stringToColor(str) {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// Status display config
export const STATUS_CONFIG = {
  TODO: { label: 'To Do', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  SUBMITTED: { label: 'Submitted', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  REVISION: { label: 'Revision', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  RESUBMITTED: { label: 'Resubmitted', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  APPROVED: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  DONE: { label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  ON_HOLD: { label: 'On Hold', color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
};

export const PROJECT_STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  ON_HOLD: { label: 'On Hold', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  ARCHIVED: { label: 'Archived', color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
};

export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'text-slate-500' },
  MEDIUM: { label: 'Medium', color: 'text-blue-500' },
  HIGH: { label: 'High', color: 'text-amber-500' },
  URGENT: { label: 'Urgent', color: 'text-red-500' },
};
