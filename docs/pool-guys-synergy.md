# The Pool Guys on Synergy

Trial: `/trials/pool-guys-remodeling/` (files in `trial-websites/pool-guys-remodeling/`). Like every trial, it is
served only after sign-in: an administrator sees it straight away; a client needs a Clients project with the slug
`pool-guys-remodeling` and a grant.

Source: the client's current site, https://m.poolguysremodeling.com/ (business name, services, about text, licence,
phone, email, service area, review and YouTube links, portfolio photos). Nothing was invented: there are no quotes or
star ratings of our own, only links to their Yelp, Angi and CSLB pages.

How it is built:

- `synergy.css` is the Synergy template's compiled stylesheet
  (`nextjs-elements/public/templates/synergy/_next/static/css/`) with the red accent `#cf2f21` swapped for pool blue
  `#0b78b4`. Rebuild it the same way if the template's CSS changes.
- `pool-guys.css` holds only the additions (pool-tinted wash, areas list, review links, footer, select field).
- `site.js` replaces the template's React code: light/dark toggle, mobile menu, reveal-on-scroll, FAQ, parallax.
- Two pages, as in the template: `index.html` (home) and `about.html`.
- Photos load from the client's own WordPress image CDN (`i0.wp.com/m.poolguysremodeling.com/...`), so they keep
  working only while the old site is up. Before going live, download the chosen photos into an `assets/` folder.
- The estimate form opens the visitor's email app addressed to info@poolguysremodeling.com. Swap it for a real form
  endpoint when the client's domain moves.
