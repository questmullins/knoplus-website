# Knoplus Website

## Cloudflare Deploy

Cloudflare should run this deploy command from the repository root:

```bash
npm run deploy
```

That script installs the Next.js app dependencies, exports the static site to `nextjs-elements/out`, then runs `wrangler deploy`.

Do not use only `npx wrangler deploy`; Wrangler will look for `nextjs-elements/out` before the Next.js build has created it.
