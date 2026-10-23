# Scrolling project previews in the Kno.plus style

The service trial at `/revamp` and the project pages now share the original homepage's black sidebar, type, buttons and full-screen photographic stage. The production homepage and its shared CSS are unchanged.

Desktop wheel scrolling advances through previews, with a short gesture lock to avoid skipping multiple items. If the copy overflows the viewport, it scrolls normally before advancing. Sidebar scrolling remains independent. Previous/next buttons and arrow/Page Up/Page Down/Home/End keys provide alternatives. The selected sidebar row is brought into view within its own scroll area.

Phones use a native vertical scroll container with full-height panels. Scrolling updates the selected section, counter and hash; the disclosure menu still jumps to any folder or project. Reduced-motion settings remove entrance animations and smooth jumps. Browser Back/Forward and direct section hashes restore the selection.

The root previews no longer render app or browser-window screenshots. Android projects show a disabled “Coming soon to Google Play” badge and Android icon alongside Explore. No live store URL, iOS availability or published release is implied. Project screenshots remain available through an explicit View screens dialog, without download controls.

The same renderer now covers RoseWave, UpDate, Textualize, Freestyle, Insta-Post Maker, website building and Prepress Assistant, including the older `/horizontal` links. Textualize's concise sections use its local project README as the source. Existing copy and the still screenshots for other projects are retained. Cellese and Excel still await selected work examples. Actual tools, website templates and the separate RoseWave gallery/shop keep their own product design and remain linked from Explore.

## Banners

Service folders and projects have distinct images; detail-page sections select contextual photographs. RoseWave uses its four designated free photographs and the existing public derivatives. Its protected member images are unchanged.

The other new banners are illustrative Unsplash photography, not photographs of Cellese, clients or delivered work. Source URLs and exported dimensions are recorded in `nextjs-elements/public/revamp/banners/sources.json`. Downloads were converted to WebP, resized to at most 1800px, and stripped of source metadata. The nighttime UpDate opening uses [Gabriel Reis’s photograph](https://unsplash.com/photos/GKSrAlXW9_E). The original homepage image and the template-specific banners are retained.

The Google Play badges remain placeholders to wire up after real store listings are available. No payment, membership, fulfillment or app-source code is changed by this update.
