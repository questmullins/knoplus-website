# Annex

Quest's dashboard at `kno.plus/annex`, part of the kno.plus Worker (`worker.js` hands it every `/annex` request). It
needs the kno.plus administrator sign-in (the same account `/clients` uses) and is styled like the rest of kno.plus
(the sidebar of the old manage page). Its pages:

- **Overview**: the last 30 days of sales and profit across every asset, website visitors, client projects, and a card
  for each asset.
- **Assets**: the money-making areas (RoseWave, UpDate and client websites to start; add more on the page). An asset
  with a sales account opens to its **Sales, Orders, Best sellers, Members, Costs and margin, Trends** and
  **Connections**; the client websites asset lists the client projects.
- **Websites**: traffic for every site on the Cloudflare account (visitors, page views, requests, threats, countries),
  Google Search Console (clicks, impressions, click-through rate, position, top searches and pages), and kno.plus page
  counts kept by the Worker without keeping who anyone is (`server/analytics.js`).
- **Speed**: after the first page shows, Annex loads every other page in the background (and each asset's sales for
  the saved date range), so switching tabs is instant. A page you open shows what's in memory at once and refreshes
  quietly, redrawing only if something changed. Any change you save clears the memory.
- **Clients**: every project and its clients in one table (Project, Client, Email, Domain, Status), with a ⋯ menu on
  each row to send a reset email, copy a reset link, edit, post an update, or turn access off. Adding projects and
  clients happens here too (`server/client-admin.js`). One sign-in serves both sides: the owner lands in Annex › Clients,
  and a client lands on their own page at `/clients`. Reset links and invites are emailed from info@kno.plus through
  Resend when the `RESEND_API_KEY` secret is set (kno.plus verified in Resend); without it, Annex shows the link to copy.
- **Guides**: Quest's SOPs and notes in markdown, owner only. They are kept in D1 (table `guides`), not in this
  repository, because the repository is public. Import the operations handbook from its Markdown export; each `##`
  section becomes a guide.
- **Settings**: which connections are on.

It installs on a phone as a web app (Add to Home Screen). The page is `nextjs-elements/public/annex/`; the server is
`annex/src/`.

## How the numbers are worked out

- **Sales** = what was paid for goods and memberships, less discounts (promo codes, print credit), less refunds.
  Sales tax and shipping charged to the buyer are left out. A refund counts on the day it happens.
- **Profit** = sales, less the fees Square actually kept, the lab's print cost, shipping (what the lab charged less
  what the buyer paid for it), chargebacks lost, and costs entered by hand (a monthly cost is spread over its days).
- Test (sandbox) orders, payments and lab costs are kept but never counted.
- Days follow the account's time zone.

## Automation

Each connection writes the same records (orders, lines, payments, refunds, costs, customers, subscriptions); the
dashboard only reads those.

- Square's webhook pulls the last three days within seconds of a payment, refund, subscription or dispute.
- Every night at 08:17 UTC the Worker's cron pulls every account's last 40 days.
- A connection's first pull brings its whole history. Settings has Refresh now and Pull all history again.

| Connection | What it brings | Worker secrets (account `rosewave`) |
|---|---|---|
| RoseWave orders | Which photo, print, size, promo code, member price and shipping charged; app or website; memberships | `ROSEWAVE_ROSEWAVE_KEY` (the same text as `ANNEX_KEY` on the RoseWave worker), plus its address in Settings |
| Square | Every payment and the fee kept, refunds, subscriptions, chargebacks; sales Square takes on its own (in person) | `ROSEWAVE_SQUARE_TOKEN`, `ROSEWAVE_SQUARE_SIGNATURE` |
| Prodigi | What the lab invoiced per order, print and shipping apart | `ROSEWAVE_PRODIGI_KEY` (and `ROSEWAVE_PRODIGI_SANDBOX` to see sandbox orders as tests) |
| Etsy | Orders and what sold, from Etsy's Orders and Order Items downloads (imported in Settings); Etsy's fees worked out per order from its rates: 6.5% transaction, 3% + $0.25 processing, $0.20 listing renewals, $29 setup, and the optional 2.5% currency conversion and 15% or 12% Offsite Ads (`annex/src/connections/etsy.js`). Gross and net after fees show on Sales | none (Etsy Plus, its listing credits and a waived setup fee are settings too) |

| Cloudflare traffic (Websites) | Every zone's requests, page views, unique visitors, data, threats, countries | `CLOUDFLARE_API_TOKEN`: My Profile › API Tokens › Create Token, with Zone › Zone › Read and Zone › Analytics › Read for all zones |
| Google Search Console (Websites) | Clicks, impressions, click-through rate, position, top searches and pages | `GOOGLE_SERVICE_ACCOUNT`: a Google Cloud service account's JSON key, with the Search Console API turned on; add its email as a user on each property |
Keys are Worker secrets and are never stored anywhere else or shown on the page.

## Turning it on

0. **Your sign-in.** Add a Worker secret `ANNEX_SETUP_CODE` (any 12+ characters) to knoplus-website, open
   `https://kno.plus/annex`, and enter that code with your email and a password. This makes the kno.plus administrator
   (the same sign-in works at `/clients`). If an administrator already exists, use "Use your setup code" on the
   sign-in screen (`/annex/#setup`) to make yours or set a new password. The form works only while the secret is set,
   so delete it afterwards. A secret added after a preview was built reaches only the next build.
1. **kno.plus Worker secrets** (Workers & Pages › knoplus-website › Settings › Variables and Secrets, type Secret):
   the connection secrets above.
2. **RoseWave worker:** deploy the `cloud/worker.js` that has `annex/feed`, add the secret `ANNEX_KEY` (any long
   random text, 24+ characters, the same as `ROSEWAVE_ROSEWAVE_KEY`).
3. **Square webhook:** Square Developer › your app › Webhooks › Add subscription, URL
   `https://kno.plus/annex/hooks/square`, events `payment.created`, `payment.updated`, `refund.created`,
   `refund.updated`, `subscription.created`, `subscription.updated`, `invoice.payment_made`, `dispute.created`,
   `dispute.state.changed`. Copy its Signature key into `ROSEWAVE_SQUARE_SIGNATURE`.
4. Open `https://kno.plus/annex`, sign in, then Settings › RoseWave orders › the RoseWave worker's address › Save ›
   Refresh now.

Annex keeps its tables in the kno.plus database (`CLIENT_DB`); they are made on first use. A seller account can have
a database of its own: bind a D1 database as `DB_<ACCOUNT>` before its first visit. Another seller is reached at
`/annex/?account=<name>` with its own secrets (`<NAME>_SQUARE_TOKEN` and so on).

## Testing on this machine

From the repository root, with `.dev.vars` copied from `annex/.dev.vars.example`:

```bash
npm install --ignore-scripts && npm run build
node node_modules/wrangler/bin/wrangler.js d1 execute knoplus-clients --local --file server/client-schema.sql
node annex/test/google-key.mjs >> .dev.vars                 # a throwaway key for the Search Console stand-in
node annex/test/fakes.mjs ../rosewave/cloud/worker.js &   # stand-ins for RoseWave, Square, Prodigi, Cloudflare and Google
node node_modules/wrangler/bin/wrangler.js dev --port 8787
node annex/test/run.mjs                                    # signs in, pulls, and checks every number by hand
```

`ANNEX_FAKE_APIS` (in `.dev.vars` only) points the connections at the stand-ins; it is ignored unless it's a
127.0.0.1 or localhost address.
