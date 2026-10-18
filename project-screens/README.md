# Project screens inbox

Drop the real screenshots for each project into its folder here. The kno.plus pages are rebuilt from them, so what's on the site matches what each project actually looks like today.

This folder is **not** published. The site only serves `nextjs-elements/out`. Screens are resized, converted to WebP and copied into `nextjs-elements/public` by hand once they've been checked.

| Folder | Pages it feeds |
| --- | --- |
| `update/` | `/projects/update` and the `/apps/update` story |
| `rosewave/` | `/projects/rosewave` and the `/apps/rosewave` story |
| `freestyle/` | `/projects/freestyle` and the home page card |
| `prepress-assistant/` | `/projects/prepress-assistant` and the home page card |
| `instapost/` | `/projects/instapost` and the home page card |
| `websites/` | The "Website Building" card on the home page |

## How to add screens

1. Open each folder's `README.md`. It lists every screen the site uses, the file name to save it as, and what it should show.
2. Save each screen with that exact file name (`.png` is best; `.jpg` or `.webp` also work). Add any extra screens you think tell the story better, and add a line for each one in the table.
3. If something moves (a pulse, a transition), add a short screen recording (`.mp4`, under 10 seconds) with the same name.
4. Put anything the write-up gets wrong in that folder's `notes.md`: features that changed, new wording, things to leave out.
5. Commit to a branch and open a pull request against `main`.

## Rules for every screen

- Use example names, numbers, places and photos only. Don't include real contacts, phone numbers, addresses or accounts.
- Don't show prices.
- Prepress Assistant: no Excel Packaging or Quickbase names, logos, colours, job numbers or customer data.
- Rosewave: only free photos can appear at full quality.
- Screenshots only. Never add source files, builds or project files here.
- Phone apps: native portrait screenshots, with no device frame (the site draws the frame). Web tools: a browser window at about 1440 × 900, with no browser chrome.
