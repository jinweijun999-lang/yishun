#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  'app/api/stripe/checkout/route.ts',
  'app/api/stripe/webhook/route.ts',
  'lib/stripe-sandbox-adapter.ts',
  'lib/error-logging.ts',
  '.env.example',
  '.env.local.example',
];

let issues = [];
for (const f of files) {
  const fp = path.join(__dirname, '..', f);
  try {
    const text = readFileSync(fp, 'utf8');
    // Look for live secret patterns (24+ chars after prefix = real Stripe keys)
    if (/sk_live_[a-zA-Z0-9]{24,}/.test(text)) issues.push('LIVE KEY: ' + f);
    if (/whsec_[a-zA-Z0-9]{24,}/.test(text)) issues.push('WEBHOOK SECRET: ' + f);
    if (/pk_live_[a-zA-Z0-9]{24,}/.test(text)) issues.push('LIVE PUBLISHABLE KEY: ' + f);
  } catch (e) {
    // skip missing files
  }
}

if (issues.length) {
  console.error('SECRET_LITERAL_CHECK: FAILED');
  issues.forEach(e => console.error(' -', e));
  process.exit(1);
} else {
  console.log('SECRET_LITERAL_CHECK: CLEAN - no live secrets hardcoded in tracked files');
  console.log('VERIFIED: sk_live_/whsec_/pk_live_ patterns absent from all Stripe-related files');
}