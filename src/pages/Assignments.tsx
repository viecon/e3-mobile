import { useState, useEffect } from 'react';

import { getPendingAssignments, type Assignment } from '@/api/moodle';
import { AssignmentCard } from '@/components/AssignmentCard';
import { PullToRefresh } from '@/components/PullToRefresh';
import { getCached, setCache } from '@/lib/cache';

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => getCached('assignments') ?? []);
  const [loading, setLoading] = useState(() => getCached('assignments') === null);

  const refresh = async () => {
    try {
      const a = await getPendingAssignments();
      setCache('assignments', a);
      setAssignments(a);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!getCached('assignments')) setLoading(true);
    refresh();
  }, []);

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="px-4 pt-2 pb-4">
      <h1 className="text-[28px] font-bold text-e3-text mb-4">未繳作業</h1>

      {loading ? (
        <div className="bg-e3-card rounded-xl overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="h-4 bg-e3-bg rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-e3-bg rounded w-1/2" />
              {i < 3 && <div className="border-b border-e3-separator mt-3 -mx-4 ml-0" />}
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-e3-card rounded-xl px-4 py-8">
          <p className="text-[15px] text-e3-muted text-center">沒有未繳作業</p>
        </div>
      ) : (
        <div className="bg-e3-card rounded-xl overflow-hidden divide-y divide-e3-separator">
          {assignments.map(a => <AssignmentCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
