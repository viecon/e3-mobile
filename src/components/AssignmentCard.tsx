
import type { Assignment } from '@/api/moodle';
import { timeLeft, urgencyColor, formatDateTime } from '@/lib/time';

export function AssignmentCard({ a }: { a: Assignment }) {
  const due = timeLeft(a.timestart);
  const color = urgencyColor(a.timestart);

  return (
    <a
      href={a.action?.url || a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-e3-card rounded-xl p-4 active:bg-e3-border transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-e3-text truncate">{a.name}</p>
          <p className="text-xs text-e3-muted mt-1">{a.course?.shortname}</p>
          <p className="text-xs text-e3-muted mt-0.5">{formatDateTime(a.timestart)}</p>
        </div>
        <div className={`text-sm font-semibold shrink-0 ${color}`}>
          {due.text}
        </div>
      </div>
    </a>
  );
}
