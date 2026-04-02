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
  return call('core_enrol_get_users_courses', { userid });
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

export async function getNews(): Promise<{ subject: string; message: string; author: string; time: number }[]> {
  const courses = await getCourses();
  const courseids = courses.slice(0, 10).map((c, i) => [`courseids[${i}]`, String(c.id)]);
  const params = Object.fromEntries(courseids);

  const forums = await call<{ id: number; type: string }[]>('mod_forum_get_forums_by_courses', params);
  const newsForums = forums.filter(f => f.type === 'news');

  const since = Math.floor(Date.now() / 1000) - 14 * 86400;
  const allNews: { subject: string; message: string; author: string; time: number }[] = [];

  for (const forum of newsForums.slice(0, 5)) {
    const result = await call<{ discussions: { subject: string; message: string; userfullname: string; timemodified: number }[] }>(
      'mod_forum_get_forum_discussions',
      { forumid: forum.id, sortorder: -1, page: 0, perpage: 5 },
    );
    for (const d of result.discussions) {
      if (d.timemodified < since) continue;
      allNews.push({ subject: d.subject, message: d.message, author: d.userfullname, time: d.timemodified });
    }
  }

  return allNews.sort((a, b) => b.time - a.time);
}

export async function getNotifications(): Promise<{ id: number; subject: string; message: string; time: number; read: boolean }[]> {
  const userid = storage.getUserId();
  if (!userid) return [];

  const result = await call<{ messages: { id: number; subject: string; smallmessage: string; timecreated: number; timeread: number }[] }>(
    'core_message_get_messages',
    { useridto: userid, type: 'notifications' as unknown as number, newestfirst: 1, limitnum: 20 },
  );

  return result.messages.map(m => ({
    id: m.id,
    subject: m.subject,
    message: m.smallmessage,
    time: m.timecreated,
    read: m.timeread > 0,
  }));
}
