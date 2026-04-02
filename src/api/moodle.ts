import * as storage from '@/lib/storage';

class MoodleApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

async function call<T>(wsfunction: string, params: Record<string, string | number> = {}): Promise<T> {
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

export async function login(proxyUrl: string, username: string, password: string): Promise<{ token: string; fullname: string; userid: number }> {
  const loginUrl = `${proxyUrl}/login/token.php`;
  const body = new URLSearchParams({ username, password, service: 'moodle_mobile_app' });

  const res = await fetch(loginUrl, { method: 'POST', body });
  const data = await res.json() as { token?: string; error?: string };

  if (!data.token) throw new MoodleApiError('login_failed', data.error ?? 'Login failed');

  // Save and verify
  storage.set('token', data.token);
  storage.set('proxyUrl', proxyUrl);

  const info = await call<{ userid: number; fullname: string }>('core_webservice_get_site_info');
  storage.set('userid', String(info.userid));
  storage.set('fullname', info.fullname);

  return { token: data.token, fullname: info.fullname, userid: info.userid };
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
