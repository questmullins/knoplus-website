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
