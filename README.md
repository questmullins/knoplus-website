# Knoplus Website

kno.plus is the home of all of Quest's work. Visitors go down routes to discover more, and clients see their active work.

| Path | What it is |
|---|---|
| `/` | The project showcase (`nextjs-elements/app/page.tsx`, built from `app/work/`) |
| `/work/<project>` | Each project: update, rosewave, textualize, instapost, websites, freestyle, prepress-assistant |
| `/websites` | The website template collection |
| `/store` | The RoseWave print store, its own route and the only place with prices |
| `/clients`, `/trials/<project>` | Client sign-in, project updates and protected trial sites |
| `/annex` | Quest's dashboard: sales, the website's numbers, clients (see `annex/README.md`) |

Old addresses (`/revamp/...`, `/manage`, `/pricing`) redirect from `worker.js`. The site before this layout is on the
`archive/website-home` branch.

## Cloudflare Deploy

Cloudflare should run this deploy command from the repository root:

```bash
npm run deploy
```

That script installs the Next.js app dependencies, exports the static site to `nextjs-elements/out`, then runs `wrangler deploy`.

If Cloudflare is still set to `npx wrangler deploy`, the root `postinstall` script now also creates `nextjs-elements/out` during dependency installation. `npm run deploy` is still preferred because it makes the build step explicit in the deploy logs.

## Contact Form

The contact modal posts to `/api/contact`, which is handled by `worker.js` during Cloudflare deploy. It does not use Formspree.

To turn on email delivery, configure one of these provider paths:

- Add a `RESEND_API_KEY` secret in Cloudflare Workers. The Worker sends to `CONTACT_TO` from `wrangler.jsonc`, currently `info@kno.plus`.
- Or add a Cloudflare Email Sending binding named `EMAIL` and set `CONTACT_FROM` to a verified sender.

Without one of those configured, the form stays visible but returns a setup message instead of sending mail.

## Rose Wave store

The store (`/store`) shows and sells the 2400-pixel copy of every set photo, loaded from the RoseWave worker's public
`web/` routes, with its live print menu and its checkout (Square, one print per order, shipping worked out by the
worker). Set a build variable `NEXT_PUBLIC_ROSEWAVE_API` to the worker's address (for example
`https://<worker>.workers.dev`) and add `https://kno.plus` to the worker's `SITE_ORIGIN` variable. Without them the store
shows the 1200-pixel copies in `nextjs-elements/public/revamp/rosewave-gallery/photos/`, keeps the bag, and offers an
email instead of checkout. Print originals and full-size files are never kept in this repository.
