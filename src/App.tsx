import { useState } from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/Login';
import { HomePage } from '@/pages/Home';
import { CoursesPage } from '@/pages/Courses';
import { AssignmentsPage } from '@/pages/Assignments';
import { NotificationsPage } from '@/pages/Notifications';
import { GradesPage } from '@/pages/Grades';
import { CourseDetailPage } from '@/pages/CourseDetail';
import { SearchPage } from '@/pages/Search';
import { BottomNav } from '@/components/BottomNav';
import * as storage from '@/lib/storage';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(storage.isLoggedIn());

  if (!loggedIn) {
    return <LoginPage onSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-e3-bg pb-20">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
