import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCalendarEvents, type Assignment } from '@/api/moodle';
import { PullToRefresh } from '@/components/PullToRefresh';
import { getCached, setCache } from '@/lib/cache';
import { formatDateTime, urgencyColor } from '@/lib/time';
import { openMoodle } from '@/lib/openMoodle';

let cachedEvents: Assignment[] | null = getCached('calendar');

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Assignment[]>(cachedEvents ?? []);
  const [loading, setLoading] = useState(cachedEvents === null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const refresh = async () => {
    try {
      const e = await getCalendarEvents();
      cachedEvents = e;
      setCache('calendar', e);
      setEvents(e);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!cachedEvents) setLoading(true);
    refresh();
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

    return days;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const e of events) {
      const d = new Date(e.timestart * 1000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const getEventsForDate = (d: Date) => {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return eventsByDate.get(key) || [];
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const today = new Date();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="px-4 pt-2 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="text-e3-accent cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={prevMonth} className="text-e3-accent p-1 cursor-pointer active:opacity-60 ml-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-e3-text">
          {year} 年 {month + 1} 月
        </h1>
        <button onClick={nextMonth} className="text-e3-accent p-1 cursor-pointer active:opacity-60">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-e3-card rounded-xl p-3 mb-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[11px] text-e3-muted font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} />;
            const hasEvents = getEventsForDate(d).length > 0;
            const isToday = sameDay(d, today);
            const isSelected = selectedDate && sameDay(d, selectedDate);

            return (
              <button
                key={d.getDate()}
                onClick={() => setSelectedDate(d)}
                className={`relative flex flex-col items-center py-1.5 cursor-pointer rounded-lg transition-colors ${
                  isSelected ? 'bg-e3-accent' :
                  isToday ? 'bg-e3-accent/10' : ''
                }`}
              >
                <span className={`text-[15px] ${
                  isSelected ? 'text-white font-semibold' :
                  isToday ? 'text-e3-accent font-semibold' :
                  'text-e3-text'
                }`}>
                  {d.getDate()}
                </span>
                {hasEvents && (
                  <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-e3-accent'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <div>
        <h2 className="text-[13px] font-medium text-e3-muted uppercase tracking-wide mb-2 px-1">
          {selectedDate.getMonth() + 1}/{selectedDate.getDate()} ({WEEKDAYS[selectedDate.getDay()]})
        </h2>
        {loading ? (
          <div className="bg-e3-card rounded-xl px-4 py-3 animate-pulse">
            <div className="h-4 bg-e3-bg rounded w-3/4 mb-1.5" />
            <div className="h-3 bg-e3-bg rounded w-1/2" />
          </div>
        ) : selectedEvents.length === 0 ? (
          <div className="bg-e3-card rounded-xl px-4 py-6">
            <p className="text-[15px] text-e3-muted text-center">沒有事件</p>
          </div>
        ) : (
          <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
            {selectedEvents.map(e => {
              const color = urgencyColor(e.timestart);
              return (
                <div
                  key={e.id}
                  onClick={() => openMoodle(e.action?.url || e.url)}
                  className="block px-4 py-3 cursor-pointer active:bg-e3-bg transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] text-e3-text">{e.name}</p>
                      <p className="text-[13px] text-e3-accent mt-0.5">
                        {e.course?.fullname?.split('.').pop()?.trim() || e.course?.shortname}
                      </p>
                      <p className="text-[13px] text-e3-muted">{formatDateTime(e.timestart)}</p>
                    </div>
                    <span className={`text-[11px] font-medium shrink-0 px-1.5 py-0.5 rounded ${color}`}>
                      {e.modulename}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}
