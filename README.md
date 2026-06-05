# Knoplus Website

## Cloudflare Deploy

Cloudflare should run this deploy command from the repository root:

```bash
npm run deploy
```

That script installs the Next.js app dependencies, exports the static site to `nextjs-elements/out`, then runs `wrangler deploy`.

If Cloudflare is still set to `npx wrangler deploy`, the root `postinstall` script now also creates `nextjs-elements/out` during dependency installation. `npm run deploy` is still preferred because it makes the build step explicit in the deploy logs.
