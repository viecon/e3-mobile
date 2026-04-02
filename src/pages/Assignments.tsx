import { useState, useEffect } from 'react';

import { getPendingAssignments, type Assignment } from '@/api/moodle';
import { AssignmentCard } from '@/components/AssignmentCard';

export function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingAssignments().then(setAssignments).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold text-e3-text mb-4">未繳作業</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-e3-card rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-e3-border rounded w-3/4 mb-2" />
              <div className="h-3 bg-e3-border rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-e3-muted text-center py-12">沒有未繳作業</p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => <AssignmentCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
