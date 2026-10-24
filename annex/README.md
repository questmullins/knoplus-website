# Annex

A sales dashboard for small photo and print sellers. Each seller is an account at `<account>.kno.plus/annex`
(RoseWave's is `rosewave.kno.plus/annex`) with its own Cloudflare D1 database. It's a separate Worker from the
kno.plus site, and this folder is the only place it lives.

- **Home:** Sales and Profit for the chosen dates, with the change against the same number of days before; orders,
  average order, active members, refunds; how profit is worked out.
- **Orders, Best sellers, Members, Costs and margin, Trends**, and **Settings** for the owner (name, time zone,
  colors, connections).
- Installable on a phone (a web app: Add to Home Screen).

## How the numbers are worked out

- **Sales** = what was paid for goods and memberships, less discounts (promo codes, print credit), less refunds.
  Sales tax and shipping charged to the buyer are left out. A refund counts on the day it happens.
- **Profit** = sales, less the fees Square actually kept, the lab's print cost, shipping (what the lab charged less
  what the buyer paid for it), chargebacks lost, and costs entered by hand (a monthly cost is spread over its days).
- Test (sandbox) orders, payments and lab costs are kept but never counted.
- Days follow the account's time zone.

## Connections

Each connection writes the same records (orders, lines, payments, refunds, costs, customers, subscriptions); the
dashboard only reads those. Keys are Worker secrets named after the account and never stored anywhere else.

| Connection | What it brings | Secrets (account `rosewave`) |
|---|---|---|
| RoseWave orders | Which photo, print, size, promo code, member price and shipping charged; app or website; memberships | `ROSEWAVE_ROSEWAVE_KEY` (the same text as `ANNEX_KEY` on the RoseWave worker), plus its address in Settings |
| Square | Every payment and the fee kept, refunds, subscriptions, chargebacks; sales Square takes on its own (in person) | `ROSEWAVE_SQUARE_TOKEN`, `ROSEWAVE_SQUARE_SIGNATURE` |
| Prodigi | What the lab invoiced per order, print and shipping apart | `ROSEWAVE_PRODIGI_KEY` (and `ROSEWAVE_PRODIGI_SANDBOX` to see sandbox orders as tests) |

Fresh data: Square's webhook triggers a pull of the last three days within seconds; every night at 08:17 UTC every
account pulls its last 40 days; a connection's first pull brings its whole history; Settings has Refresh and
Pull all history again.

## Setting it up on Cloudflare

1. **Address.** In the kno.plus zone, DNS › Add record: type `AAAA`, name `rosewave`, IPv6 `100::`, Proxied on.
   (Each new seller gets one of these.)
2. **Databases.** Storage & Databases › D1 › Create: one named `annex`, one named `annex-rosewave`. Put each one's
   Database ID in `wrangler.jsonc` in place of `REPLACE-WITH-…`. The tables are made on first use.
3. **Worker.** Workers & Pages › Create › Import a repository › `knoplus-website`, with root directory `annex` and
   deploy command `npx wrangler deploy` (or run `npx wrangler deploy` in this folder). It adds the route
   `*.kno.plus/annex*` and the nightly cron.
4. **Secrets** (Worker › Settings › Variables and Secrets, type Secret): `ANNEX_SETUP_CODE` (any 12+ characters,
   used once to create the owner's sign-in), then the connection secrets above.
5. **RoseWave worker:** paste the new `cloud/worker.js` and add the secret `ANNEX_KEY` (any long random text, 24+
   characters, the same as `ROSEWAVE_ROSEWAVE_KEY`).
6. **Square webhook:** Square Developer › your app › Webhooks › Add subscription, URL
   `https://rosewave.kno.plus/annex/hooks/square`, events `payment.created`, `payment.updated`, `refund.created`,
   `refund.updated`, `subscription.created`, `subscription.updated`, `invoice.payment_made`, `dispute.created`,
   `dispute.state.changed`. Copy its Signature key into `ROSEWAVE_SQUARE_SIGNATURE`.
7. Open `https://rosewave.kno.plus/annex`, enter the setup code and your email and password, then Settings ›
   RoseWave orders › the RoseWave worker's address › Save › Refresh now.

A new seller later: steps 1 and 2 for their name (database binding `DB_<NAME>` in `wrangler.jsonc`), redeploy, add
their secrets, and they set up at `<name>.kno.plus/annex`.

## Testing on this machine

```bash
npm install
cp .dev.vars.example .dev.vars
node test/fakes.mjs ../../rosewave/cloud/worker.js &   # stand-ins for RoseWave, Square and Prodigi
npx wrangler dev --port 8787
npm test                                              # sets up an account and checks every number by hand
```

`ANNEX_FAKE_APIS` (in `.dev.vars` only) points the connections at the stand-ins; it is ignored unless it's a
127.0.0.1 or localhost address.
