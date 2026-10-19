# Project hub log (Oct 18–19, 2026)

Everything that changed while kno.plus was turned into a project hub, why each change was made, and why it was rolled back.

## Where the work is now

- **Live site:** back to the website page, matching the site before the hub (`backup/before-project-hub`, commit `e6465cc`).
- **All hub work:** saved on the branch `archive/project-hub` (commit `d93630f`). Nothing was deleted, so any piece can be brought back.
- **Kept on `main`:** this log, the `project-screens/` inbox for real screenshots, and the `.gitignore` line for TypeScript build files. None of these are published.

## What changed, in order

### 1. Project hub (PR #6, Oct 18)
- **Intent:** turn kno.plus from a website-template business into a hub of Quest's projects, with the website business as one section.
- **Changes:**
  - Moved the website business to `/websites`, with 301 redirects from the old addresses (`/about`, `/process`, `/pricing` and the SEO pages).
  - Added write-ups at `/projects/[name]` for UpDate, Rosewave, Freestyle, Prepress Assistant and Insta-Post Maker.
  - Added `/apps/[name]` as scroll-through story previews for the phone apps (UpDate, Rosewave), not the working apps.
  - Hosted Freestyle at `/webtools/freestyle/` and moved Insta-Post Maker to `/webtools/instapost/`.
  - Renamed the Excel-derived Illustrator panels "Prepress Assistant" and showed them as drawn cards only, with no Excel or Quickbase branding.
  - Hid prices in the projects and showed Rosewave's free art only (other photos down-sized).
- **Result:** Quest found the pages full of large decorative gradient boxes with no content, and the app screens didn't look like the real apps.

### 2. Synergy restyle with real screens (PR #7, Oct 18)
- **Intent:** make the projects feel integrated and balanced, modelled on the Synergy template, and show UpDate and Rosewave as they really look.
- **Changes:**
  - Restyled the hub, project pages and app stories with a light glass look (floating pill nav, Montserrat headings, feature grids, FAQs).
  - Captured real screens: UpDate from its workbench with example data, Rosewave from its app page with free photos only.
- **Result:** closer, but UpDate still missed recent work: the pulsing emergency icon, the new Plan a Date flow and the updated text boxes.

### 3. Screenshot inbox (PR #8, Oct 18)
- **Intent:** get the real current screens from each project's own sessions instead of recreating them.
- **Changes:** added `project-screens/<project>/`, where each folder has a shot list (`README.md`) and a `notes.md` for corrections. It isn't published.
- **Status:** kept on `main`, still waiting for screenshots.

### 4. Studio index home page (PR #9, Oct 19)
- **Intent:** make the home page feel curated and consulting-led, like the website page, instead of AI-styled. Quest picked "Studio index" from four directions.
- **Changes:** the home page became a dark index using the website page's sidebar, type and buttons. Each project was written as a short case (the problem, what I built) beside its real screen.
- **Result:** Cloudflare didn't deploy the merge on its own. A README change (PR #10) triggered the deploy.

## Why it was rolled back

The site ended up as three visual languages at once:
- the dark editorial website page;
- light Synergy-style project and story pages;
- a dark studio home page.

Each round fixed one complaint in isolation, so the whole never read as one thing. Quest wants one cohesive site, built more deliberately.

## Decisions that still stand

These came from Quest during the hub work and should carry into the next attempt unless Quest changes them:
- Use paths only, no subdomains.
- Quest uses "apps" to mean phone apps.
- Phone app pages are story previews, not the working app.
- Tools that run on the site live under one path (`/webtools/` was used).
- Never mention Excel Packaging or Quickbase, or show their branding or data. The panels are called "Prepress Assistant".
- No prices on project pages.
- Rosewave: free art at full quality, everything else down-sized.
- No project source files on the public site.
- Freestyle should be the File / Edit / View menu version, which isn't in any GitHub repo yet.

## A more deliberate approach for next time

1. **Agree what kno.plus is in one sentence.** For example: a studio that builds websites and tools, a portfolio, or a consulting practice. Everything else follows from that.
2. **One design system, written down first.** Start from the website page (dark, Kanit, Stack Sans and Cormorant, sidebar list, outlined buttons). Define the few pieces every page needs: header, page intro, section, project card, screen frame, case block and contact. Get Quest's approval before building any page.
3. **Content before layout.** Collect real screenshots through `project-screens/`, and write each project's copy with Quest.
4. **One page at a time on a preview link.** Show each page on a Cloudflare preview URL and merge only when the set looks like one site.
5. **Reuse what's on `archive/project-hub`** (screens, copy, redirects) where it fits the new system, rather than rebuilding.
