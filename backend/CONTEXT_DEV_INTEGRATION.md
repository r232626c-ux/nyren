Context.dev integration for COLI (backend)

Files added:
- `lib/contextDevClient.js` - server-side wrapper (SDK preferred, HTTP fallback)
- `scripts/brandDemo.js` - local demo CLI (dry-run by default, use `--live` to call API)

Endpoints used:
- `POST https://api.context.dev/v1/brand/retrieve` (HTTP fallback)

SDK calls (when `context.dev` SDK is installed):
- `client.brand.retrieve({ domain })`
- `client.brand.retrieveByEmail({ email })`
- `client.brand.retrieveByName({ name })`
- `client.brand.retrieveByTicker({ ticker })`

Configuration:
- Set `CONTEXT_DEV_API_KEY` in your environment. For local development, add to `.env.local` or use the existing backend `.env` pattern.
- Optional: set `REDIS_URL` to enable Redis caching. TTL (ms) can be controlled with `CONTEXT_BRAND_TTL_MS` (defaults to 24h).

Local demo:
1. Dry run (no network call):
   node scripts/brandDemo.js --domain coli.ai

2. Live call (requires `CONTEXT_DEV_API_KEY`):
   CONTEXT_DEV_API_KEY=your_key node scripts/brandDemo.js --domain coli.ai --live

Notes:
- This implementation prefers the official SDK if installed. To add the SDK, run in `backend`:

```
cd backend
npm install context.dev
```

- If you want me to install the SDK and add a typed TypeScript wrapper, say so and I will update package.json and implement it.
