import { useState } from 'react';
import type { Assignment } from '@/api/moodle';
import { timeLeft, urgencyColor, formatDateTime } from '@/lib/time';
import { stripHtml } from '@/lib/html';
import { shortCourseName } from '@/lib/course';

export function AssignmentCard({ a }: { a: Assignment }) {
  const [open, setOpen] = useState(false);
  const due = timeLeft(a.timestart);
  const color = urgencyColor(a.timestart);
  const link = a.action?.url || a.url;

  return (
    <div className="bg-e3-card">
      <div
        onClick={() => setOpen(!open)}
        className="px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] text-e3-text">{a.name}</p>
            <p className="text-[13px] text-e3-muted mt-0.5">{a.course?.fullname ? shortCourseName(a.course.fullname) : a.course?.shortname}</p>
            <p className="text-[13px] text-e3-muted">{formatDateTime(a.timestart)}</p>
          </div>
          <span className={`text-[13px] font-medium shrink-0 ${color}`}>
            {due.text}
          </span>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-3 border-t border-e3-separator pt-2">
          {a.description && (
            <p className="text-[13px] text-e3-muted whitespace-pre-line leading-relaxed mb-2">
              {stripHtml(a.description)}
            </p>
          )}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-e3-accent font-medium"
          >
            在 E3 開啟
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
