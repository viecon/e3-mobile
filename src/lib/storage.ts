const PREFIX = 'e3m_';

export function get(key: string): string | null {
  return localStorage.getItem(PREFIX + key);
}

export function set(key: string, value: string): void {
  localStorage.setItem(PREFIX + key, value);
}

export function remove(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

export function getToken(): string | null {
  return get('token');
}

export function getUserId(): number | null {
  const v = get('userid');
  return v ? Number(v) : null;
}

export function getProxyUrl(): string | null {
  return get('proxyUrl');
}

export function isLoggedIn(): boolean {
  return !!getToken() && !!getProxyUrl();
}

export function logout(): void {
  remove('token');
  remove('userid');
  remove('fullname');
  remove('proxyUrl');
}
