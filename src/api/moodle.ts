import * as storage from '@/lib/storage';

class MoodleApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

async function rawCall<T>(wsfunction: string, params: Record<string, string | number> = {}): Promise<T> {
  const proxyUrl = storage.getProxyUrl();
  const token = storage.getToken();
  if (!proxyUrl || !token) throw new MoodleApiError('no_auth', 'Not logged in');

  const url = `${proxyUrl}/webservice/rest/server.php?wstoken=${token}&moodlewsrestformat=json&wsfunction=${wsfunction}`;

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    body.append(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { method: 'POST', body, signal: controller.signal });
    if (!res.ok) throw new MoodleApiError('http', `HTTP ${res.status}`);
    const data = await res.json();
    if (data?.exception) throw new MoodleApiError(data.errorcode, data.message);
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

let refreshing: Promise<void> | null = null;

async function tryAutoRelogin(): Promise<boolean> {
  const proxyUrl = storage.getProxyUrl();
  const username = storage.get('username');
  const password = storage.get('password');
  if (!proxyUrl || !username || !password) return false;

  try {
    const loginUrl = `${proxyUrl}/login/token.php`;
    const body = new URLSearchParams({ username, password, service: 'moodle_mobile_app' });
    const res = await fetch(loginUrl, { method: 'POST', body });
    const data = await res.json() as { token?: string };
    if (!data.token) return false;
    storage.set('token', data.token);
    return true;
  } catch {
    return false;
  }
}

async function call<T>(wsfunction: string, params: Record<string, string | number> = {}): Promise<T> {
  try {
    return await rawCall<T>(wsfunction, params);
  } catch (err) {
    if (err instanceof MoodleApiError && err.code === 'invalidtoken') {
      if (!refreshing) refreshing = tryAutoRelogin().then(ok => { refreshing = null; if (!ok) throw err; });
      await refreshing;
      return rawCall<T>(wsfunction, params);
    }
    throw err;
  }
}

export async function login(proxyUrl: string, username: string, password: string): Promise<{ token: string; fullname: string; userid: number }> {
  const loginUrl = `${proxyUrl}/login/token.php`;
  const body = new URLSearchParams({ username, password, service: 'moodle_mobile_app' });

  const res = await fetch(loginUrl, { method: 'POST', body });
  const data = await res.json() as { token?: string; error?: string };

  if (!data.token) throw new MoodleApiError('login_failed', data.error ?? 'Login failed');

  // Save credentials for auto-relogin and verify
  storage.set('token', data.token);
  storage.set('proxyUrl', proxyUrl);
  storage.set('username', username);
  storage.set('password', password);

  const info = await call<{ userid: number; fullname: string }>('core_webservice_get_site_info');
  storage.set('userid', String(info.userid));
  storage.set('fullname', info.fullname);

  return { token: data.token, fullname: info.fullname, userid: info.userid };
}

export interface GradeItem {
  itemname: string;
  grade: string;
  grademax: string;
  percentage: string;
}

export interface CourseGrade {
  courseid: number;
  courseName: string;
  items: GradeItem[];
  total: string;
}

export async function getGrades(): Promise<CourseGrade[]> {
  const userid = storage.getUserId();
  if (!userid) throw new MoodleApiError('no_user', 'No user ID');

  const courses = await getCourses();
  const results = await Promise.all(
    courses.map(c =>
      call<{ tables: { courseid: number; tabledata: { itemname?: { content: string }; grade?: { content: string }; percentage?: { content: string }; range?: { content: string } }[] }[] }>(
        'gradereport_user_get_grades_table',
        { userid, courseid: c.id },
      ).then(r => ({ course: c, table: r.tables[0] }))
       .catch(() => null)
    )
  );

  const decodeHtml = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&ndash;/g, '–').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();

  const skipPatterns = ['手動項目', '計算出的成績', '個人微調', '全班微調', '依配分計算'];

  return results.filter(Boolean).map(r => {
    const { course, table } = r!;
    const rows = table.tabledata || [];
    const items: GradeItem[] = [];
    let total = '-';

    for (const row of rows) {
      if (!row.itemname?.content) continue;
      const name = decodeHtml(row.itemname.content);
      const grade = decodeHtml(row.grade?.content || '-') || '-';
      const pct = decodeHtml(row.percentage?.content || '-') || '-';
      const range = decodeHtml(row.range?.content || '');
      const grademax = range.split('–').pop()?.trim() || '100';

      if (name.toLowerCase().includes('course total') || name.includes('課程總分')) {
        total = grade !== '-' ? grade : pct;
        continue;
      }

      if (skipPatterns.some(p => name.includes(p))) continue;
      if (name === course.fullname || name === course.shortname) continue;

      items.push({ itemname: name, grade, grademax, percentage: pct });
    }

    return { courseid: course.id, courseName: course.fullname, items, total };
  }).filter(g => g.items.length > 0 && g.items.some(i => i.grade !== '-'));
}

export interface CourseModule {
  id: number;
  name: string;
  modname: string;
  url?: string;
  contents?: { filename: string; fileurl: string; filesize: number }[];
}

export interface CourseSection {
  id: number;
  name: string;
  summary: string;
  modules: CourseModule[];
}

export async function getCourseContent(courseid: number): Promise<CourseSection[]> {
  return call<CourseSection[]>('core_course_get_contents', { courseid });
}

export async function getCourseNews(courseid: number): Promise<{ subject: string; message: string; author: string; time: number }[]> {
  const forums = await call<{ id: number; type: string }[]>('mod_forum_get_forums_by_courses', { 'courseids[0]': courseid });
  const newsForum = forums.find(f => f.type === 'news');
  if (!newsForum) return [];

  const result = await call<{ discussions: { subject: string; message: string; userfullname: string; timemodified: number }[] }>(
    'mod_forum_get_forum_discussions',
    { forumid: newsForum.id, sortorder: -1, page: 0, perpage: 10 },
  );
  return result.discussions.map(d => ({ subject: d.subject, message: d.message, author: d.userfullname, time: d.timemodified }));
}

export interface CourseAssignment {
  id: number;
  name: string;
  duedate: number;
  intro: string;
}

export async function getCourseAssignments(courseid: number): Promise<CourseAssignment[]> {
  const result = await call<{ courses: { id: number; assignments: CourseAssignment[] }[] }>(
    'mod_assign_get_assignments',
    { 'courseids[0]': courseid },
  );
  const course = result.courses.find(c => c.id === courseid);
  return (course?.assignments || []).sort((a, b) => b.duedate - a.duedate);
}

export async function getCourses(): Promise<{ id: number; shortname: string; fullname: string }[]> {
  const userid = storage.getUserId();
  if (!userid) throw new MoodleApiError('no_user', 'No user ID');
  const courses = await call<{ id: number; shortname: string; fullname: string; enddate: number; hidden: boolean }[]>(
    'core_enrol_get_users_courses',
    { userid },
  );
  const now = Math.floor(Date.now() / 1000);
  return courses.filter(c => !c.hidden && (c.enddate === 0 || c.enddate > now));
}

export interface Assignment {
  id: number;
  name: string;
  course?: { id: number; fullname: string; shortname: string };
  timestart: number;
  overdue: boolean;
  action?: { actionable: boolean; url: string };
  modulename: string;
  url: string;
  instance: number;
}

export async function getCalendarEvents(): Promise<Assignment[]> {
  const now = Math.floor(Date.now() / 1000);
  const result = await call<{ events: Assignment[] }>('core_calendar_get_action_events_by_timesort', {
    timesortfrom: now - 30 * 86400,
    timesortto: now + 120 * 86400,
  });
  return result.events;
}

export async function getPendingAssignments(): Promise<Assignment[]> {
  const now = Math.floor(Date.now() / 1000);
  const result = await call<{ events: Assignment[] }>('core_calendar_get_action_events_by_timesort', {
    timesortfrom: now - 86400,
    timesortto: now + 60 * 86400,
  });
  return result.events.filter(e => e.action?.actionable && e.modulename === 'assign');
}

export async function getNews(): Promise<{ subject: string; message: string; author: string; time: number; courseName: string }[]> {
  const courses = await getCourses();
  const courseids = courses.slice(0, 10).map((c, i) => [`courseids[${i}]`, String(c.id)]);
  const params = Object.fromEntries(courseids);

  const forums = await call<{ id: number; course: number; type: string }[]>('mod_forum_get_forums_by_courses', params);
  const newsForums = forums.filter(f => f.type === 'news');

  const courseMap = new Map(courses.map(c => [c.id, c.fullname]));

  const since = Math.floor(Date.now() / 1000) - 30 * 86400;

  const results = await Promise.all(
    newsForums.map(forum =>
      call<{ discussions: { subject: string; message: string; userfullname: string; timemodified: number }[] }>(
        'mod_forum_get_forum_discussions',
        { forumid: forum.id, sortorder: -1, page: 0, perpage: 10 },
      ).then(result => ({ forum, discussions: result.discussions }))
       .catch(() => ({ forum, discussions: [] as { subject: string; message: string; userfullname: string; timemodified: number }[] }))
    )
  );

  const allNews: { subject: string; message: string; author: string; time: number; courseName: string }[] = [];
  for (const { forum, discussions } of results) {
    const name = courseMap.get(forum.course) ?? '';
    for (const d of discussions) {
      if (d.timemodified < since) continue;
      allNews.push({ subject: d.subject, message: d.message, author: d.userfullname, time: d.timemodified, courseName: name });
    }
  }

  return allNews.sort((a, b) => b.time - a.time);
}

export interface Notification {
  id: number;
  subject: string;
  message: string;
  body: string;
  time: number;
  read: boolean;
  courseName: string | null;
  courseShortname: string | null;
}

export async function getNotifications(): Promise<Notification[]> {
  const userid = storage.getUserId();
  if (!userid) return [];

  const [result, courses] = await Promise.all([
    call<{ messages: { id: number; subject: string; smallmessage: string; fullmessage: string; fullmessagehtml: string; timecreated: number; timeread: number }[] }>(
      'core_message_get_messages',
      { useridto: userid, type: 'notifications' as unknown as number, newestfirst: 1, limitnum: 30 },
    ),
    getCourses().catch(() => [] as { id: number; shortname: string; fullname: string }[]),
  ]);

  return result.messages.filter(m => !m.subject.includes('新登入紀錄')).map(m => {
    // Try to match course from subject (e.g. "1142.515605：公告...")
    let courseName: string | null = null;
    let courseShortname: string | null = null;

    for (const c of courses) {
      if (m.subject.includes(c.shortname) || m.smallmessage.includes(c.shortname)) {
        courseName = c.fullname;
        courseShortname = c.shortname;
        break;
      }
    }

    // Full body: prefer fullmessage (plain text), fallback to stripped HTML
    const body = m.fullmessage?.trim()
      || m.fullmessagehtml?.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
      || '';

    return {
      id: m.id,
      subject: m.subject,
      message: m.smallmessage || body.slice(0, 80),
      body,
      time: m.timecreated,
      read: m.timeread > 0,
      courseName,
      courseShortname,
    };
  });
}
