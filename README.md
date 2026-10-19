# Knoplus Website

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

## Site Layout

- `/` is the studio index (`nextjs-elements/components/StudioHome.tsx`, copy in `nextjs-elements/data/studio.ts`).
- `/projects/[name]` holds each project's write-up, and `/apps/[name]` holds the phone app stories (`nextjs-elements/data/projects.ts` and `nextjs-elements/data/appStories.ts`).
- `/webtools/[name]` serves the browser tools from `nextjs-elements/public/webtools/`.
- `/websites/...` is the website template service. `worker.js` redirects the old paths there.
- `project-screens/` collects the real screenshots for each project. It isn't published.
