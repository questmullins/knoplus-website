// The built-in SOPs on Annex › Guides: what Quest most often needs to do, in plain words, each with buttons that go
// straight to the right place. Steps use **bold**, `code` and [links](https://…). Served only to the owner.
// No keys or passwords belong here: this file is in the public repository.
const CF = "https://dash.cloudflare.com/?to=/:account/workers/services/view/knoplus-website/production";
const go = (label, href) => ({ label, href });
const SECRETS = go("Cloudflare › secrets", CF + "/settings");

export const SOPS = [
  {
    group: "Clients",
    items: [
      {
        id: "client-password", q: "Reset a client's password",
        answer: "Open Clients, press ⋯ next to their name, and choose Send reset email. It comes from info@kno.plus.",
        steps: [
          "Open **Clients** in the sidebar.",
          "Find the client. A gold **Asked for a reset** tag means they already asked for one.",
          "Press **⋯** next to their row and choose **Send reset email**.",
          "They get an email from **info@kno.plus** with a one-time link that expires in **one hour**. Their old sessions are signed out.",
          "If emails aren't set up yet, or they can't find it, choose **Copy a reset link** instead and send it to them privately by text.",
        ],
        go: [go("Open Clients", "#clients")],
      },
      {
        id: "client-new", q: "Sign up a new client",
        answer: "Add the project, then add the client to it. They get an email from info@kno.plus to choose their own password.",
        steps: [
          "Open **Clients** and press **Add project**. Enter the name, a short id like `houseplant-nation`, their domain (like `example.com`) and a status. Add a trial address only if their preview site exists. Press **Save**.",
          "Press **Add client**. Enter their name and email and pick the project. Leave the password empty and press **Add client**.",
          "They get an invite from **info@kno.plus** with a link to choose a password. The link lasts **3 days**.",
          "If emails aren't set up yet, copy the link Annex shows you and send it to them privately.",
          "To give an existing client a second project, use **Add client** again with the same email.",
        ],
        go: [go("Open Clients", "#clients")],
      },
      {
        id: "client-status", q: "Mark a project as ongoing, live, or waiting on payment",
        answer: "Each project has a status in the Clients list. Change it right in the table.",
        steps: [
          "Open **Clients**.",
          "Use the **Status** menu on the project's row: **Ongoing, Payment needed, Waiting on client, Live, Paused** or **Done**. It saves at once.",
          "Use the status filter above the table to see, for example, every project that needs payment.",
        ],
        go: [go("Open Clients", "#clients")],
      },
      {
        id: "client-update", q: "Post an update for a client",
        answer: "Clients see your updates the next time they sign in.",
        steps: ["Open **Clients**, press **⋯** on the project's row and choose **Post an update**.", "Write a title and the update, then press **Post update**."],
        go: [go("Open Clients", "#clients")],
      },
      {
        id: "client-remove", q: "Stop a client from getting in",
        answer: "Turning off access stops them at once and keeps their history.",
        steps: [
          "Open **Clients**, press **⋯** next to their name and choose **Turn off access**. Choose **Turn access back on** to undo it.",
          "To take away only one project, choose **Remove from this project** on that project's row. Their login stays.",
        ],
        go: [go("Open Clients", "#clients")],
      },
      {
        id: "client-quote", q: "Send a new client a quote or a contract",
        answer: "Quotes and contracts aren't built into kno.plus yet; bills and contracts inside the client login are planned. For now, use the contract template.",
        steps: [
          "Open the contract template on GitHub and copy it into a Google Doc or Word file.",
          "Fill in the client, the project and the date.",
          "Write the quote as its own page: what you'll build, the price and the timeline. The agreement says that page decides the project details.",
          "Have an attorney look over the template once before you use it for real.",
          "Send both as a PDF, get it signed with any e-signature app, and keep the signed copy.",
          "Once it's signed, sign the client up.",
          "Prices never go on kno.plus itself; only /store shows prices.",
        ],
        go: [go("Contract template", "https://github.com/questmullins/knoplus-website/blob/main/contracts/knoplus-website-service-agreement.md")],
      },
      {
        id: "client-trial", q: "Put a client's preview website online",
        answer: "This adds files to the website code, so ask Claude, or follow the steps on GitHub.",
        steps: [
          "The site goes in the code under `trial-websites/<slug>/` and goes live through a pull request.",
          "Then in **Clients**, add or edit the project with the trial address `/trials/<slug>/` and add the client to it.",
          "Only clients with access can open it.",
        ],
        go: [go("How trials work", "https://github.com/questmullins/knoplus-website/blob/main/trial-websites/README.md"), go("Open Clients", "#clients")],
      },
    ],
  },
  {
    group: "Money and sales",
    items: [
      {
        id: "money-etsy-connect", q: "Connect Etsy so orders come in by themselves",
        answer: "Once linked, Annex pulls Etsy's orders every night, and within a minute of Etsy's webhook saying an order or listing changed. Etsy's active listing count comes in too.",
        steps: [
          "Once, in Cloudflare (**Workers & Pages › knoplus-website › Settings › Variables and Secrets**): add the app's keystring as **ETSY_KEY**, its shared secret as **ETSY_SECRET**, and the webhook's signing secret as **ETSY_WEBHOOK_SECRET**. All three are in Etsy's developer portal.",
          "Once, in Etsy's developer portal: the callback URL is `https://kno.plus/annex/etsy/callback` and the webhook URL is `https://kno.plus/annex/hooks/etsy` (Order and Listing events).",
          "Open **Assets › RoseWave › Connections › Etsy** and press **Connect Etsy**. Sign in to Etsy, press **Allow access**, and Etsy sends you back. Every past order comes in over the next minute.",
          "Etsy's sign-in is kept encrypted in Annex's database; only ETSY_SECRET unlocks it. If you change ETSY_SECRET, or Etsy says the link has ended, press **Connect Etsy** again.",
          "**Disconnect** stops the pulls. Orders already in Annex stay.",
        ],
        go: [go("Open Etsy settings", "#asset/rosewave/settings"), go("Etsy developer portal", "https://www.etsy.com/developers/your-apps")],
      },
      {
        id: "money-etsy", q: "Count Etsy sales and Etsy's fees",
        answer: "Annex takes Etsy's sales straight from Etsy once it's connected (or from the files Etsy lets you download), and works out Etsy's fees for every order. Sales, gross and net after fees then include them.",
        steps: [
          "Once: open **Assets › RoseWave › Connections › Etsy**. Enter the day the shop opened ($29 setup fee, or tick that it was waived), whether you have Etsy Plus, how many listings are active, your Offsite Ads rate (15%, or 12% over $10,000 a year), and tick currency conversion only if your shop's currency differs from your bank's. Press **Save**.",
          "Connected? Orders come in by themselves; skip the next two steps. Otherwise, in Etsy open **Shop Manager › Settings › Options › Download Data** and download **Orders** and **Order Items** for the months you want.",
          "Back in Connections › Etsy, import the Orders file, then the Order Items file. Importing again only updates, it never doubles.",
          "If an order came through an Offsite Ad, tick **From an Offsite Ad** on it under **Orders**. Its fee is added at once.",
          "See the fees part by part under **Costs and margin › Etsy fees**, and gross and net under **Sales**.",
        ],
        go: [go("Open Etsy settings", "#asset/rosewave/settings"), go("Etsy downloads", "https://www.etsy.com/your/shops/me/download")],
      },
      {
        id: "money-etsy-plus", q: "What Etsy Plus gives me, and how Annex counts it",
        answer: "Etsy Plus is $10 a month, taken from your Etsy payment account. Annex counts the $10 and the listing credits; the rest are shop tools.",
        steps: [
          "**15 listing credits a month** ($3.00 of listing fees). They reset each month and don't roll over. Annex takes them off that month's listing fees, never more than the fees.",
          "**$5 a month of Etsy Ads credit**, for ads shown on Etsy itself (not Offsite Ads). It also resets monthly. Annex doesn't count Etsy Ads spend, so this credit isn't counted either.",
          "**Shop look:** a banner carousel or collage, a featured grid of listings, and a custom colour theme for your shop home.",
          "**Restock requests:** shoppers can ask to be emailed when a sold-out item is back (it has to sell out, not be marked sold out by hand).",
          "**Search insights:** unlimited searches of Etsy's search data.",
          "**Setup fee:** if your Plus deal waived the $29 setup fee, tick **The $29 setup fee was waived** in Connections › Etsy.",
          "**To set it up in Annex:** Connections › Etsy › tick **Etsy Plus**, enter the day it started, and press **Save**.",
        ],
        go: [go("Open Etsy settings", "#asset/rosewave/settings")],
      },
      {
        id: "money-rosewave", q: "See how much RoseWave made",
        answer: "Overview shows the last 30 days. RoseWave's own page has every detail for any dates.",
        steps: ["Open **Assets › RoseWave**.", "Use the tabs: **Sales, Orders, Best sellers, Members, Costs and margin, Trends**.", "Change the dates with the menu under the tabs."],
        go: [go("Open RoseWave sales", "#asset/rosewave/home"), go("Open Overview", "#overview")],
      },
      {
        id: "money-refund", q: "Refund a print order",
        answer: "Refunds happen in Square. Annex picks them up within seconds and takes them off your sales.",
        steps: ["Open the **Square Dashboard › Transactions**.", "Find the payment, open it and press **Refund**.", "If the print hasn't shipped, cancel it with Prodigi too."],
        go: [go("Square transactions", "https://app.squareup.com/dashboard/sales/transactions"), go("Prodigi dashboard", "https://dashboard.prodigi.com/")],
      },
      {
        id: "money-cost", q: "Add a cost, like a subscription or supplies",
        answer: "Costs you add take away from profit. A monthly cost is spread across its days.",
        steps: ["Open **Assets › RoseWave › Costs and margin**.", "Add the cost with its name, amount and date, and whether it repeats monthly."],
        go: [go("Open costs", "#asset/rosewave/costs")],
      },
      {
        id: "money-stale", q: "Fix sales numbers that look wrong or old",
        answer: "Most of the time a refresh fixes it. If a connection shows an error, the key behind it has probably expired.",
        steps: ["Open **Assets › RoseWave › Connections** and press **Refresh now**.", "If a connection shows an error, make a new key where it came from and replace that secret in Cloudflare.", "**Pull all history again** rebuilds everything if numbers are still off."],
        go: [go("Open connections", "#asset/rosewave/settings"), SECRETS],
      },
      {
        id: "money-asset", q: "Add a new business or app to my dashboard",
        answer: "Each money-making area is an asset. It shows on Overview and Assets.",
        steps: [
          "Open **Assets** and press **Add an asset**.",
          "Give it a short id (it can't change later), a name, a kind (store, app, service, tool), a status and a one-line note.",
          "Pick **Sales from** only if it already takes money through Square. Otherwise leave it on Not connected.",
          "Press **Save**.",
        ],
        go: [go("Open Assets", "#assets")],
      },
    ],
  },
  {
    group: "Websites and visitors",
    items: [
      {
        id: "web-stats", q: "See how my websites are doing",
        answer: "Websites shows visitors and page views for every site on Cloudflare, and how often people click you in Google.",
        steps: [
          "Open **Websites** and choose 7, 28 or 90 days.",
          "**Click-through rate** is the share of people who saw you in Google and clicked. Google's numbers run about 2 days behind.",
          "If a section says Not connected, follow its setup guide below.",
        ],
        go: [go("Open Websites", "#websites")],
      },
      {
        id: "web-messages", q: "Read contact-form messages",
        answer: "Messages from the kno.plus contact form arrive at **info@kno.plus**. Annex › Websites counts how many came in.",
        steps: ["Check the info@kno.plus inbox.", "If messages stop arriving, check that the `RESEND_API_KEY` secret is still in Cloudflare."],
        go: [go("Open Websites", "#websites"), SECRETS],
      },
      {
        id: "web-store", q: "Fix the print store if checkout disappears",
        answer: "If kno.plus/store shows small photos and an email button instead of checkout, it can't reach the RoseWave server.",
        steps: [
          "On knoplus-website, the build variable **NEXT_PUBLIC_ROSEWAVE_API** must be the RoseWave server's address.",
          "On the RoseWave server, the variable **SITE_ORIGIN** must include `https://kno.plus`.",
          "After changing either one, redeploy.",
        ],
        go: [go("Open the store", "/store"), go("Cloudflare › settings", CF + "/settings")],
      },
    ],
  },
  {
    group: "Your login and keys",
    items: [
      {
        id: "me-password", q: "Reset my own password, or I'm locked out",
        answer: "Your setup code lets you set a new password any time it's saved in Cloudflare.",
        steps: [
          "In Cloudflare, check that the secret **ANNEX_SETUP_CODE** exists on knoplus-website. If not, add one (any 12+ characters).",
          "Open **kno.plus/annex#setup**.",
          "Enter the setup code, your email and a new password (12+ characters).",
          "Optional: delete the setup code afterwards, and add it again next time.",
        ],
        go: [go("Open the setup form", "/annex/#setup"), SECRETS],
      },
      {
        id: "me-secret", q: "Add or replace a secret (a key the site uses)",
        answer: "Secrets are saved in Cloudflare and never shown again.",
        steps: [
          "Open Cloudflare › Workers & Pages › **knoplus-website** › Settings › **Variables and Secrets** › **Add**.",
          "Choose **Production**, tick **Secret**, type the exact name and paste the value.",
          "Press **Add and deploy**. To replace one, edit its value the same way.",
        ],
        go: [SECRETS],
      },
      {
        id: "me-leak", q: "Deal with a key or password that leaked",
        answer: "If it was pasted in a chat, an email or code, treat it as leaked.",
        steps: ["Make a new key where it came from (Cloudflare, Google, Square or Prodigi).", "Replace the secret in Cloudflare.", "Delete the old key where it came from. Change a leaked password straight away."],
        go: [SECRETS, go("Cloudflare API tokens", "https://dash.cloudflare.com/profile/api-tokens")],
      },
    ],
  },
  {
    group: "Changing the website",
    items: [
      {
        id: "site-change", q: "Change something on the website",
        answer: "Changes are checked on a preview first. kno.plus only changes when you press Merge.",
        steps: [
          "Ask Claude for the change. It's made on a branch (a working copy of the code).",
          "Cloudflare posts a **preview link** on the pull request. Check it on your computer and phone; the preview has its own login.",
          "Happy with it? On GitHub, open the pull request and press **Merge**. kno.plus updates within a few minutes.",
        ],
        go: [go("Pull requests", "https://github.com/questmullins/knoplus-website/pulls")],
      },
      {
        id: "site-undo", q: "Undo a change that went wrong",
        answer: "Rolling back is instant and changes no code.",
        steps: [
          "Open Cloudflare › knoplus-website › **Deployments**.",
          "Pick the deployment before the bad one and press **Rollback**.",
          "To undo it for good, open the merged pull request on GitHub, press **Revert**, and merge that.",
        ],
        go: [go("Cloudflare deployments", CF + "/deployments"), go("Pull requests", "https://github.com/questmullins/knoplus-website/pulls?q=is%3Apr+is%3Amerged")],
      },
    ],
  },
  {
    group: "One-time setup",
    items: [
      {
        id: "setup-email", q: "Set up emails to clients (reset links and invites)",
        answer: "Client emails go out through Resend, a sending service, so they come from info@kno.plus. Until it's set up, Annex gives you a link to copy instead.",
        steps: [
          "First check: if **Clients** shows no note about emails, `RESEND_API_KEY` is already set (the contact form can use it too) and you're done. Otherwise:",
          "Make a free account at [resend.com](https://resend.com).",
          "Go to **Domains › Add domain**, enter `kno.plus`, and let Resend add its records to Cloudflare (or copy them into Cloudflare › kno.plus › DNS). Wait until it says **Verified**.",
          "Go to **API Keys › Create API key**. Give it **Sending access** to kno.plus only. Copy the key; Resend shows it once.",
          "Open Cloudflare › **knoplus-website › Settings › Variables and Secrets › Add**. Type **Secret**, name `RESEND_API_KEY`, paste the key and deploy.",
          "Open **Clients**. The note about emails at the top goes away once it works. Try **⋯ › Send reset email** on a test client.",
          "Replies to these emails go to **info@kno.plus**.",
        ],
        go: [go("Resend domains", "https://resend.com/domains"), go("Resend API keys", "https://resend.com/api-keys"), SECRETS],
      },
      {
        id: "setup-cloudflare", q: "Connect Cloudflare (website visitor numbers)",
        answer: "A read-only key lets Annex show visitors for every site on your Cloudflare account.",
        steps: [
          "Cloudflare › My Profile › **API Tokens** › **Create Token** › **Create Custom Token**. Name it \"Annex traffic (read only)\".",
          "Tick **Read** on two rows only: **Zone** (in DNS & Zones) and **Zone Analytics** (in Analytics & Logs).",
          "For which websites, choose **All domains**. Create it and copy it; Cloudflare shows it once.",
          "Save it as the secret **CLOUDFLARE_API_TOKEN**.",
          "Check: **Settings** here says Cloudflare traffic is Connected.",
        ],
        go: [go("Cloudflare API tokens", "https://dash.cloudflare.com/profile/api-tokens"), SECRETS, go("Annex settings", "#settings")],
      },
      {
        id: "setup-google", q: "Connect Google Search (clicks and click-through rate)",
        answer: "A \"robot\" Google user reads Search Console for you. It can only read.",
        steps: [
          "In Google Cloud, switch to the project **Knoplus** and enable the **Google Search Console API**.",
          "**IAM & Admin › Service Accounts › Create**, name it \"annex\", skip the roles.",
          "Open it › **Keys › Add key › Create new key › JSON**. Open the file and copy all of it.",
          "Save it as the secret **GOOGLE_SERVICE_ACCOUNT**.",
          "In Search Console, open each site › **Settings › Users and permissions › Add user**. Paste the file's `client_email` and choose **Restricted**.",
          "Delete the downloaded file.",
          "If Google says key creation is disabled: **Organization Policies** › \"Disable service account key creation\" › Override parent's policy › **Not enforced**.",
        ],
        go: [
          go("Enable the API", "https://console.cloud.google.com/apis/library/searchconsole.googleapis.com"),
          go("Service accounts", "https://console.cloud.google.com/iam-admin/serviceaccounts"),
          go("Search Console", "https://search.google.com/search-console"),
          SECRETS,
        ],
      },
      {
        id: "setup-rosewave", q: "Connect RoseWave sales (Square, Prodigi, the app)",
        answer: "Three keys bring RoseWave's sales in. After that it runs on its own, every sale within seconds and a full re-check every night.",
        steps: [
          "Make up a long random password (24+ characters). Save it as **ANNEX_KEY** on the RoseWave server and as **ROSEWAVE_ANNEX_KEY** here. They must match.",
          "Save your Square access token as **ROSEWAVE_SQUARE_TOKEN** and your Prodigi key as **ROSEWAVE_PRODIGI_KEY**.",
          "In Square Developer › your app › **Webhooks**, add `https://kno.plus/annex/hooks/square` with the payment, refund, subscription, invoice payment and dispute events. Save its **Signature key** as **ROSEWAVE_SQUARE_SIGNATURE**.",
          "In **Assets › RoseWave › Connections**, enter the RoseWave server's address, press Save, then **Refresh now**.",
        ],
        go: [go("Square Developer", "https://developer.squareup.com/apps"), SECRETS, go("Open connections", "#asset/rosewave/settings")],
      },
    ],
  },
];
