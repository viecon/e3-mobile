/**
 * Cloudflare Worker — CORS Proxy for E3 Moodle API
 * Forwards requests to e3p.nycu.edu.tw and adds CORS headers.
 */

const TARGET = 'https://e3p.nycu.edu.tw';
const ALLOWED_ORIGINS = [
  'https://viecon.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

/* ── Rate Limiting (per-IP, in-memory) ── */

const RATE_LIMIT = 60;          // max requests
const RATE_WINDOW_MS = 60_000;  // per 1 minute

const hits = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ── Helpers ── */

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

const ALLOWED_PATH_PREFIXES = ['/webservice/', '/login/'];

function isOriginAllowed(origin: string | null): origin is string {
  return origin !== null && ALLOWED_ORIGINS.includes(origin);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body: Record<string, unknown>, status: number, origin?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

/* ── Worker ── */

export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get('Origin');

    // ── Origin check ──
    // Preflight and API calls must come from an allowed origin.
    // Direct browser navigation (no Origin header) is also blocked.
    if (!isOriginAllowed(origin)) {
      return json({ error: 'Origin not allowed' }, 403);
    }

    // ── CORS preflight ──
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Method check ──
    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, origin);
    }

    // ── Rate limiting ──
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(ip)) {
      return json({ error: 'Rate limit exceeded' }, 429, origin);
    }

    // ── Path validation ──
    const url = new URL(request.url);
    const path = decodeURIComponent(url.pathname);

    if (path.includes('..') || path.includes('//')) {
      return json({ error: 'Invalid path' }, 400, origin);
    }

    if (!ALLOWED_PATH_PREFIXES.some((p) => path.startsWith(p))) {
      return json({ error: 'Forbidden path' }, 403, origin);
    }

    // ── Body size check (POST only) ──
    if (request.method === 'POST') {
      const cl = request.headers.get('Content-Length');
      if (cl && parseInt(cl, 10) > MAX_BODY_BYTES) {
        return json({ error: 'Payload too large' }, 413, origin);
      }
    }

    // ── Proxy ──
    const targetUrl = TARGET + url.pathname + url.search;

    try {
      const proxyResponse = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type':
            request.headers.get('Content-Type') ||
            'application/x-www-form-urlencoded',
        },
        body: request.method === 'POST' ? request.body : undefined,
      });

      const responseHeaders = new Headers(proxyResponse.headers);

      // Add CORS headers
      for (const [k, v] of Object.entries(corsHeaders(origin))) {
        responseHeaders.set(k, v);
      }

      // Strip any cookies from upstream to avoid session leakage
      responseHeaders.delete('Set-Cookie');

      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: responseHeaders,
      });
    } catch {
      return json({ error: 'Proxy error' }, 502, origin);
    }
  },
};
