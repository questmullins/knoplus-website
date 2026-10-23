# Rose Wave gallery and print shop concept

The standalone concept lives at `/revamp/rosewave/gallery`, linked from both the RoseWave project opening and its card on `/revamp`. The project walkthrough and Google Play placeholder stay available.

The wide collection strips take their cue from the photography template. The typography, palette, sun, waves, room photographs, and frame textures come from the RoseWave app and UI kit. Nothing new needed to be rendered in Blender: the existing kit already supplies editable Blender sources and the artwork used here.

## Asset provenance

Source: `questmullins/rosewave`, main commit `9341d5f` (2026-10-23). That repository was fetched and updated locally at `G:\Code\rosewave`; its source, Android assets, and design assets remain local. Only selected web assets are copied to `nextjs-elements/public/revamp/rosewave-gallery/`.

- Collection membership and free-photo selection: `source/sets.json`.
- Photographs: `source/th2/`, matched by `names.json`. The four designated free photographs retain their available working-copy resolution (800–1200 pixels). All 41 member photographs are reduced to a maximum of 240 pixels on either edge before publication. No private originals, original filenames, or full-resolution member images are included.
- Sun and wave layers: `android/app/src/main/assets/ui/`.
- Rooms and frame textures: `source/rooms/` and `source/frames/`. Room placement follows the app's measured pixels-per-inch and hanging anchors. These are illustrative previews; photos are fitted to the selected print proportions.
- Palette and type: `design/ui-kit-v1/spec/tokens.json`; Jost Light and DM Sans from the UI kit. Font licenses are included alongside the self-hosted fonts.
- Print options and prices: the public catalog fields extracted from `cloud/worker.js`, with lab identifiers excluded. This is a dated snapshot, not a live price service.

## What works

Each collection opens its photographs. Selecting one opens a print preview with paper, framed, metal, acrylic, and canvas choices, supported sizes, eight frame finishes, three room scenes, and a photograph-only view. Keyboard focus and Escape use native modal dialogs; closing a print returns to the collection beneath it.

The bag supports quantities, removal, current catalog subtotals, and optional browser storage. “Ask about these prints” opens an email draft to the existing public Kno.plus address with the selections. It does not send email or place an order automatically.

## Before accepting orders

This is a published design concept with an explicitly labeled shop preview. Payments, shipping, tax, account membership, print fulfillment, and stock checks are not connected. No credentials or private app endpoints are copied into the site. The app's Square/Prodigi integration remains in its own repository. Connecting web ordering requires a separate server-side integration and final price/shipping verification.

This route is marked noindex while the concept is under review. It has no photo download links, GIFs, playback controls, or generic template-picker overlays.
