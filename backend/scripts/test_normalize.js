const fs = require('fs');
const path = require('path');
const ContextService = require('../services/ContextService');

function assert(cond, msg) {
  if (!cond) {
    console.error('Assertion failed:', msg);
    process.exit(2);
  }
}

async function main() {
  const fixturePath = path.join(__dirname, '..', 'test', 'fixtures', 'brand_sample.json');
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const normalized = ContextService.normalizeBrandToColi(raw);

  console.log('Normalized output:', normalized);

  assert(normalized.name === 'COLI', 'name should be COLI');
  assert(Array.isArray(normalized.logos), 'logos should be array');
  assert(normalized.primaryColor === '#22D3EE' || normalized.primaryColor === null, 'primaryColor should map');

  console.log('All assertions passed.');
  process.exit(0);
}

main();
