#!/usr/bin/env node
/* Demo CLI for Context.dev integration
 * Usage:
 *  node scripts/brandDemo.js --domain coli.ai         (dry-run)
 *  node scripts/brandDemo.js --domain coli.ai --live   (call live API; requires CONTEXT_DEV_API_KEY)
 */
const { retrieveBrandProfile } = require('../lib/contextDevClient');

function parseArgs() {
  const args = {};
  const parts = process.argv.slice(2);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === '--live') {
      args.live = true;
      continue;
    }
    if (!p.startsWith('--')) continue;
    const key = p.replace(/^--/, '');
    const val = parts[i + 1] && !parts[i + 1].startsWith('--') ? parts[i + 1] : true;
    args[key] = val;
    if (val !== true) i++;
  }
  return args;
}

async function main() {
  const { domain, email, name, ticker, live } = parseArgs();

  if (!domain && !email && !name && !ticker) {
    console.log('Usage: node scripts/brandDemo.js --domain example.com [--live]');
    process.exit(1);
  }

  console.log('COLI Context.dev demo');
  console.log('Input:', { domain, email, name, ticker, live: !!live });

  if (!live) {
    console.log('\nDry run: no network call will be made. Re-run with --live to call Context.dev API (requires CONTEXT_DEV_API_KEY).');
    process.exit(0);
  }

  try {
    const input = {};
    if (domain) input.domain = domain;
    if (email) input.email = email;
    if (name) input.name = name;
    if (ticker) input.ticker = ticker;

    const resp = await retrieveBrandProfile(input);
    console.log('\nBrand summary:');
    if (resp && resp.brand) {
      const b = resp.brand;
      console.log('Name:', b.title || b.domain || b.name);
      console.log('Description:', b.description || '(none)');
      console.log('Primary colors:', (b.colors || []).map((c) => c.hex).join(', '));
      console.log('Logos:', (b.logos || []).slice(0, 3).map((l) => l.url).join('\n  '));
    } else {
      console.log(JSON.stringify(resp, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(2);
  }
}

main();
