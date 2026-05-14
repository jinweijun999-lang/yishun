const BASE_URL = process.env.SMOKE_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000';

async function postJson(path, payload) {
  const response = await fetch(new URL(path, BASE_URL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { response, body };
}

function assert(condition, message, details) {
  if (!condition) {
    const suffix = details ? `\n${JSON.stringify(details, null, 2)}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

const eventSmoke = await postJson('/api/events', {
  event: 'smoke_event',
  ts: new Date().toISOString(),
  properties: {
    source: 'yishun_v3_gap_smoke',
    birth_date: '1990-01-01',
  },
});
assert(eventSmoke.response.status === 200, '/api/events must return HTTP 200', eventSmoke);
assert(eventSmoke.body.ok === true && eventSmoke.body.accepted >= 1, '/api/events must accept JSON event', eventSmoke.body);

const shareSmoke = await postJson('/api/v1/shares', {
  anonymous_id: `anon_smoke_${Date.now()}`,
  source_screen: 'bazi_result',
  card_type: 'daily_luck',
  template_id: 'mystic',
  locale: 'en-US',
  public_payload: {
    title: 'Today’s Work timing card',
    theme: 'Work',
    summary: 'Timing clarity is ready without exposing private birth details.',
    best_window: '13:00–15:00',
    avoid_window: 'forcing a final answer too early',
    action: 'Choose one meaningful push before you commit.',
    score_label: '75/100 clarity',
  },
  utm: { source: 'smoke', medium: 'cli', campaign: 'v3_gap_fix' },
});
assert(shareSmoke.response.status === 201, '/api/v1/shares must create or degrade-create share link', shareSmoke);
assert(/^shr_/.test(String(shareSmoke.body.share_id)) && /\/s\/shr_/.test(String(shareSmoke.body.share_url)), 'share create must return public share identifiers', shareSmoke.body);
assert(!JSON.stringify(shareSmoke.body).includes('1990-01-01'), 'share response must not leak birth date', shareSmoke.body);

const checkoutSmoke = await postJson('/api/stripe/checkout', {
  product: 'report_single',
  clientReferenceId: 'smoke_user',
});
assert([200, 502, 503].includes(checkoutSmoke.response.status), 'checkout must return a controlled JSON response', checkoutSmoke);
if (checkoutSmoke.response.status === 200) {
  assert(typeof checkoutSmoke.body.url === 'string' && checkoutSmoke.body.url.startsWith('https://'), 'configured checkout must return redirect URL', checkoutSmoke.body);
} else {
  assert(typeof checkoutSmoke.body.error === 'string' && checkoutSmoke.body.error.length > 0, 'unconfigured checkout must return friendly error', checkoutSmoke.body);
  assert(!String(checkoutSmoke.body.error).includes('STRIPE_SECRET_KEY'), 'checkout user error must not expose secret env names', checkoutSmoke.body);
}

console.log(JSON.stringify({
  ok: true,
  baseUrl: BASE_URL,
  checks: {
    events: eventSmoke.body,
    share: { status: shareSmoke.response.status, share_id: shareSmoke.body.share_id, share_url: shareSmoke.body.share_url },
    checkout: { status: checkoutSmoke.response.status, code: checkoutSmoke.body.code || null },
  },
}, null, 2));
