import type { Assignment } from '@/api/moodle';
import { timeLeft, urgencyColor, formatDateTime } from '@/lib/time';
import { openMoodle } from '@/lib/openMoodle';

export function AssignmentCard({ a }: { a: Assignment }) {
  const due = timeLeft(a.timestart);
  const color = urgencyColor(a.timestart);

  return (
    <div
      onClick={() => openMoodle(a.action?.url || a.url)}
      className="block bg-e3-card px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-e3-text">{a.name}</p>
          <p className="text-[13px] text-e3-muted mt-0.5">{a.course?.fullname?.split('.').pop()?.trim() || a.course?.shortname}</p>
          <p className="text-[13px] text-e3-muted">{formatDateTime(a.timestart)}</p>
        </div>
        <span className={`text-[13px] font-medium shrink-0 ${color}`}>
          {due.text}
        </span>
      </div>
    </div>
  );
}
