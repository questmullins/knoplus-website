# Rose Wave gallery and print shop concept

The standalone concept lives at `/revamp/rosewave/gallery`, linked from both the RoseWave project opening and its card on `/revamp`. The project walkthrough and Google Play placeholder stay available.

The gallery now uses the actual Kno.plus Photography template: expanding collection strips, Kanit typography, paper/ink palette, a sticky collection filter, an asymmetric photo grid, the dark about section, and the editorial footer. `template.module.css` is adapted directly from `public/templates/photo-portfolio/styles.css`, scoped to this route so the original homepage and template demo remain unchanged. A RoseWave brand layer adds its ivory/peach/plum palette, self-hosted Jost and DM Sans, sun-and-wave emblem, textured app background layers, and original gallery/print/grid/menu/arrow icons. The collection-strip interactions and photo-grid structure remain from the template. RoseWave supplies the photographs, room scenes, frame textures, and print options. A visible credit links to the original template as a working portfolio example.

## Asset provenance

Source: `questmullins/rosewave`, main commit `9341d5f` (2026-10-23). That repository was fetched and updated locally at `G:\Code\rosewave`; its source, Android assets, and design assets remain local. Only selected web assets are copied to `nextjs-elements/public/revamp/rosewave-gallery/`.

- Collection membership and free-photo selection: `source/sets.json`.
- Photographs: at the owner's explicit request on 2026-10-23, all 45 gallery photos now use the full-size JPEGs available in the RoseWave cloud library. They were exported through the authenticated Cloudflare object previews without changing bucket access or exporting credentials. Dimensions match the online manifest (typically 2400 pixels tall; landscape files reach 4799 pixels wide), and each image was matched against its previous thumbnail. The full-size cloud JPEGs are published unchanged under `photos/full/`, with separate 1200-pixel WebPs for grid tiles. The opening collection banners and photo/product/room viewers use the full-size source; tiles and bag thumbnails use the lighter copy. This supersedes the earlier 240-pixel member-preview cap for these 45 selected website images only. The private app repository and any higher-resolution camera/print masters remain separate.
- Sun and wave layers: `android/app/src/main/assets/ui/`. Navigation/action icons: `design/ui-kit-v1/assets/icon_*.png` (only the six used icons are published).
- Rooms and frame textures: `source/rooms/` and `source/frames/`. Room placement follows the app's measured pixels-per-inch and hanging anchors. These are illustrative previews; photos are fitted to the selected print proportions.
- Palette and type: `design/ui-kit-v1/spec/tokens.json`; Jost Light and DM Sans from the UI kit. Font licenses are included alongside the self-hosted fonts.
- Print options and prices: the public catalog fields extracted from `cloud/worker.js`, with lab identifiers excluded. This is a dated snapshot, not a live price service.

## What works

The home page keeps the expanding collection banners, while each opens a dedicated `/revamp/rosewave/gallery/collections/[collection]` page with that collection's photographs. The photo grid no longer appears on the home page. Collection filters link between the four pages; each can be opened directly, refreshed, or reached through browser history. The `/collections` index redirects to the first collection.

Selecting a photograph opens a full-screen product view, initially showing the uncropped photograph. Photograph / Print preview / In a room controls switch between the original image, an isolated textured-frame preview, and three measured room scenes. Previous/next arrows browse the current collection without closing the product view. Changes of photograph, preview view, and room slide the complete outgoing scene away while the incoming scene enters from the opposite edge. The outgoing scene retains its photo/material/size/frame settings and is hidden from assistive technology; interrupted transitions settle on the latest selection. Reduced-motion preferences make the transition immediate.

Finish, frame, and size use native dropdowns. Paper, framed, metal, acrylic, and canvas choices, supported sizes, and eight named frame finishes remain available; the frame dropdown is disabled for finishes without a frame. The app's CSS material treatments are restored on both the isolated print and room previews: canvas weave and wrapped-edge shadow, metal sheen, acrylic reflection/edge depth, framed glazing and inset shade, and matte paper with a white border. Existing frame-texture images remain in use. Choosing a material, size, or frame from the photograph view switches to the print preview. Scrolling vertically over the size control moves through that material's supported sizes, updating price and preview without scrolling the options panel. The control clamps at either end, throttles trackpad bursts, and retains native dropdown/keyboard selection; horizontal gestures and Ctrl-wheel zoom are left alone. On desktop the artwork stays visible beside independently scrolling product options and a fixed price/add-to-bag area; phones use one vertical product view beneath the persistent gallery-return header. Keyboard focus and Escape use native print/bag modal dialogs; closing a print returns to the photo grid.

The bag supports quantities, removal, current catalog subtotals, and optional browser storage. “Ask about these prints” opens an email draft to the existing public Kno.plus address with the selections. It does not send email or place an order automatically.

## Before accepting orders

This is a published design concept with an explicitly labeled shop preview. Payments, shipping, tax, account membership, print fulfillment, and stock checks are not connected. No credentials or private app endpoints are copied into the site. The app's Square/Prodigi integration remains in its own repository. Connecting web ordering requires a separate server-side integration and final price/shipping verification.

The opening collection bands retain a centered maximum width on large displays. On phones, both the bands and the collection photo grids extend to the edges of the page; text on photography is white with a contrast scrim. The introductory headline has its own space below the fixed navigation.

Collection expansion follows the middle 20% of the visible viewport (40–60% from the top), on both desktop and mobile. When two bands intersect that region, the incoming band wins in the scroll direction; only one is expanded. Selection is evaluated on scrolling and viewport resizing, not on the expansion animation, and scroll anchoring is disabled to prevent layout changes from causing oscillation. Reduced-motion preferences remove transitions and parallax. Links still open their collection normally and retain visible keyboard focus. The browser context menu remains suppressed within the gallery and its dialogs.

Website-specific Blender artwork replaces the stretched app layers in the intro, about section, and footer. Each has independent mobile and desktop compositions with the original watercolor textures, undistorted circular sun, and space reserved for HTML text. The packed Blender scenes and reproducible render script are in `design/rosewave-web/`.

This route is marked noindex while the concept is under review. It has no photo download links, GIFs, playback controls, or generic template-picker overlays.
