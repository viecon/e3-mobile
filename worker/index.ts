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

function corsOrigin(request: Request): string {
  const origin = request.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsHeaders(request: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': corsOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    // Only allow proxying to Moodle API paths
    const url = new URL(request.url);
    const path = url.pathname;
    if (!path.startsWith('/webservice/') && !path.startsWith('/login/')) {
      return new Response('Forbidden', { status: 403 });
    }

    const targetUrl = TARGET + path + url.search;

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type': request.headers.get('Content-Type') || 'application/x-www-form-urlencoded',
        },
        body: request.method !== 'GET' ? request.body : undefined,
      });

      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });

      const cors = corsHeaders(request);
      for (const [k, v] of Object.entries(cors)) {
        newResponse.headers.set(k, v);
      }

      return newResponse;
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy error' }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(request),
        },
      });
    }
  },
};
