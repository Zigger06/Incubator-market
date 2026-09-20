import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
// Public endpoint, constrained by validation, payload size, CORS, honeypot and DB rate limits.
Deno.serve(async (request: Request) => {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = request.headers.get('origin') || '';
  const headers = { 'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : 'null', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Vary': 'Origin' };
  const reply = (status: number, error?: string) => new Response(JSON.stringify(error ? { error } : { ok: true }), { status, headers });
  if (!allowed.includes(origin)) return reply(403, 'Unavailable');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, 'Unavailable');
  try {
    // Stream into a bounded buffer; Content-Length alone is untrusted.
    const reader = request.body?.getReader(); if (!reader) return reply(400, 'Invalid message');
    let length = 0; const chunks: Uint8Array[] = [];
    while (true) { const part = await reader.read(); if (part.done) break; length += part.value.length; if (length > 16384) { await reader.cancel(); return reply(413, 'Invalid message'); } chunks.push(part.value); }
    const bytes = new Uint8Array(length); let offset = 0; for (const part of chunks) { bytes.set(part, offset); offset += part.length; }
    const input = JSON.parse(new TextDecoder().decode(bytes));
    if (input.website) return reply(200);
    const valid = (key: string, min: number, max: number) => typeof input[key] === 'string' && input[key].trim().length >= min && input[key].length <= max;
    if (!valid('name', 2, 100) || !valid('subject', 2, 150) || !valid('message', 10, 3000) || typeof input.phone !== 'string' || !/^\+992\d{9}$/.test(input.phone)) return reply(400, 'Invalid message');
    const salt = Deno.env.get('CONTACT_RATE_SALT'); if (!salt) return reply(503, 'Unavailable');
    // Header is supplied by the hosting proxy. Global quota still caps abuse if IP varies.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + ip));
    const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { error } = await client.rpc('submit_contact', { p_hash: hash, p_message: input });
    if (error) return reply(error.message.includes('rate limited') ? 429 : 503, 'Please try later');
    return reply(200);
  } catch { return reply(400, 'Invalid message'); }
});
