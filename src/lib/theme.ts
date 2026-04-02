export type Theme = 'system' | 'light' | 'dark';

const KEY = 'e3m_theme';

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) || 'system';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme?: Theme): void {
  const t = theme ?? getTheme();
  if (t === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', t);
  }
}

export function cycleTheme(): Theme {
  const order: Theme[] = ['system', 'light', 'dark'];
  const current = getTheme();
  const next = order[(order.indexOf(current) + 1) % order.length];
  setTheme(next);
  return next;
}

export const themeLabel: Record<Theme, string> = {
  system: '自動',
  light: '淺色',
  dark: '深色',
};
