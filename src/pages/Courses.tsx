import { useState, useEffect } from 'react';

import { getCourses } from '@/api/moodle';
import { PullToRefresh } from '@/components/PullToRefresh';

type Course = { id: number; shortname: string; fullname: string };
let cachedCourses: Course[] | null = null;

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(cachedCourses ?? []);
  const [loading, setLoading] = useState(cachedCourses === null);

  const refresh = async () => {
    try {
      const c = await getCourses();
      cachedCourses = c;
      setCourses(c);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!cachedCourses) setLoading(true);
    refresh();
  }, []);

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="p-4">
      <h1 className="text-lg font-bold text-e3-text mb-4">課程</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-e3-card rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-e3-border rounded w-3/4 mb-2" />
              <div className="h-3 bg-e3-border rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map(c => (
            <a
              key={c.id}
              href={`https://e3p.nycu.edu.tw/course/view.php?id=${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-e3-card rounded-xl p-4 active:bg-e3-border transition-colors"
            >
              <p className="text-sm font-medium text-e3-text">{c.fullname}</p>
              <p className="text-xs text-e3-muted mt-1">{c.shortname}</p>
            </a>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
