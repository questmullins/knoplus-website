# Rose Wave gallery and print shop concept

The standalone concept lives at `/revamp/rosewave/gallery`, linked from both the RoseWave project opening and its card on `/revamp`. The project walkthrough and Google Play placeholder stay available.

The gallery now uses the actual Kno.plus Photography template: expanding collection strips, Kanit typography, paper/ink palette, a sticky collection filter, an asymmetric photo grid, the dark about section, and the editorial footer. `template.module.css` is adapted directly from `public/templates/photo-portfolio/styles.css`, scoped to this route so the original homepage and template demo remain unchanged. A RoseWave brand layer adds its ivory/peach/plum palette, self-hosted Jost and DM Sans, sun-and-wave emblem, textured app background layers, and original gallery/print/grid/menu/arrow icons. The collection-strip interactions and photo-grid structure remain from the template. RoseWave supplies the photographs, room scenes, frame textures, and print options. A visible credit links to the original template as a working portfolio example.

## Asset provenance

Source: `questmullins/rosewave`, main commit `9341d5f` (2026-10-23). That repository was fetched and updated locally at `G:\Code\rosewave`; its source, Android assets, and design assets remain local. Only selected web assets are copied to `nextjs-elements/public/revamp/rosewave-gallery/`.

- Collection membership and free-photo selection: `source/sets.json`.
- Photographs: `source/th2/`, matched by `names.json`. The four designated free photographs retain their available working-copy resolution (800–1200 pixels). All 41 member photographs are reduced to a maximum of 240 pixels on either edge before publication. No private originals, original filenames, or full-resolution member images are included.
- Sun and wave layers: `android/app/src/main/assets/ui/`. Navigation/action icons: `design/ui-kit-v1/assets/icon_*.png` (only the six used icons are published).
- Rooms and frame textures: `source/rooms/` and `source/frames/`. Room placement follows the app's measured pixels-per-inch and hanging anchors. These are illustrative previews; photos are fitted to the selected print proportions.
- Palette and type: `design/ui-kit-v1/spec/tokens.json`; Jost Light and DM Sans from the UI kit. Font licenses are included alongside the self-hosted fonts.
- Print options and prices: the public catalog fields extracted from `cloud/worker.js`, with lab identifiers excluded. This is a dated snapshot, not a live price service.

## What works

Each collection opens its photographs. Selecting one opens a print preview with paper, framed, metal, acrylic, and canvas choices, supported sizes, eight frame finishes, three room scenes, and a photograph-only view. Collection filters stay on the page. Keyboard focus and Escape use native print/bag modal dialogs; closing a print returns to the photo grid.

The bag supports quantities, removal, current catalog subtotals, and optional browser storage. “Ask about these prints” opens an email draft to the existing public Kno.plus address with the selections. It does not send email or place an order automatically.

## Before accepting orders

This is a published design concept with an explicitly labeled shop preview. Payments, shipping, tax, account membership, print fulfillment, and stock checks are not connected. No credentials or private app endpoints are copied into the site. The app's Square/Prodigi integration remains in its own repository. Connecting web ordering requires a separate server-side integration and final price/shipping verification.

This route is marked noindex while the concept is under review. It has no photo download links, GIFs, playback controls, or generic template-picker overlays.
