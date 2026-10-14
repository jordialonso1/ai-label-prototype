# Store flow prototype: notes history

Chronological context for future sessions. `NOTES.md` holds the current rules and state. This file holds what happened, why, and what is still open. Newest session first.

## 2026-10-14 (session 2: AI label review tooling)

### What changed
1. **Tab bar**: labels now Home, Discover, Orders, Profile (real app). Orders uses the uds-react `bags` icon (`assets/icons/tab-bags.svg`, foreground variant, 24px). `tab-cart.svg` is unused.
2. **Wrapper page** (`src/App.tsx`, `src/app.css`): title "AI labels touchpoints" (also the tab title in `index.html`), no subtitle, title block and checkboxes in a left column, device frame centred. The page never scrolls: the device is scaled with `transform: scale` to fit the viewport (never up, minimum 0.3).
3. **Highlight AI labels checkbox**: pulsing ring around every `[data-ai-label]` element, shape from Figma `196:75575`, recoloured to `--brand-color-secondary` (green) on request. The ring fades to 70% (not 35%) so it stays visible. While highlighting, `overflow: hidden` is lifted on the store tile, Domino's banner and lunch banner, and their images get their own radius.
4. **AI label stepper** (shown only while highlight is on, jumps to label 1 when ticked): prev/next with counter, name and screen. The prototype switches screen, opens modals (Ad modal, Translations dropdown) and scrolls. 9 labels, names set by the user: Store tile icon, Ads featured banner icon, Ads featured banner label (Ad modal tag, placed via `data-ai-after`), Ads full width featured banner label, Header image icon, Footer banner for multiple generated content (Store view), Content translations, Image label, Footer banner for multiple generated content (Product view).
5. **Reference image checkbox**: swaps the 3 "Enhanced" tags to "Reference" (`data-tag-text` spans).
6. Messages between wrapper and prototype (all `postMessage`, same origin): `highlight-ai`, `reference-image`, `focus-ai-label`, `ai-labels-query` (wrapper to prototype) and `ai-labels` (prototype to wrapper).

### Tooling lessons
- Reading a screenshot straight after `sips` or Chrome often returns "File not found" (the file is still being written). Wait a second and read again.
- To drive the wrapper in headless Chrome, write a throwaway `public/_t.html` that embeds `/` in an iframe, clicks the real checkboxes and prints state into a `<pre>`, then use `--dump-dom`. Delete it afterwards. `grep` on a Vite dev page counts injected CSS, so check element state, not text.
- To capture a paused pulse frame, inject `animation-play-state: paused; animation-delay: <t>` for `[data-ai-label]`.
- Prettier on `src/App.tsx` needs `--no-semi --single-quote` to match the project (the default rewrites the whole file).

### Open items and unverified points
- The pulse timing and growth (1.6s, +3px) are my choice, since Figma has no motion data. The animation itself was only checked as paused frames.
- Highlight was visually checked on the Honest Greens tile, Domino's banner, Product view tag and notice. Not looked at on the Store view, lunch banner and modals. Stepper jumps were checked for 4, 7 and 9 only; the others by name and order.
- Enhanced tag ring on the Product view sits close to the status bar.
- "Reference" tag width was not checked in a screenshot.
- Clicking through the prototype while the device is scaled down was not tested.
- The deploy workflow uses Node 20 actions (deprecated) and `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19. Not broken yet.
- Older open items from the first session below still stand, except the tab bar labels (resolved).

### State at end of session
- Committed and pushed: `abc230f` on `main`, deployed to GitHub Pages (build and deploy green).
- Working tree clean except a stray root `.DS_Store` (not committed on purpose).
- A Vite dev server is running on port 5173 (started earlier, may be stale).

## 2026-10-14

### What changed (all in `public/prototype/index.html` unless noted)
1. **Store view header**: sparkle icon moved to the right under the chevron and "Enhanced" text removed (Figma node `195:66575`, 16x16 at x=370,y=256). Uses `ai-sparkle-light.svg` (md5 matches Figma). Vertical offset (`margin-top: -4px`) was eyeballed.
2. **Ad modalsheet** (Figma `160:38331`): "Info (i)" text button in the Domino's featured banner on the Store wall opens it as an overlay. Content: "Paid Ad" title, disclosure text, neutral "Enhanced" tag. New assets `modal-top.svg` (curved top) and `cross-24.svg`.
3. **Translations dropdown** (Figma `179:38458`): translate button in the Store view nav opens it. Title "Options", four inert rows (Store information, Add to favourites, Share store, Translate to Spanish / AI generated). New assets `modal-info/heart/share/translate.svg`. Dividers are a CSS border, not the SVG.
4. **Translate button style**: changed from the grey toggle style to a floating icon button (Figma `141:37563` navBar). Now uses `modal-translate.svg` (same file as Figma's icon). `nav-translate.svg` is unused and left in place.
5. **Store wall category art**: grey circles replaced with `uds-react/src/assets/illustrations/` SVGs (`promoTagsRedGreen`, `vegetarian`, `mediterranean`, `mexican`, `asian`), copied to `assets/img/cat-*.svg`. The grey `#F4F4F4` square and white documentation banner baked into four of them were stripped.
6. **Store wall collapsed header** (from a real-app screenshot): after the search field scrolls away, a translucent blurred header with back, "Search in Food", map button and the chips fades in. JS is in the nav script (`updateWallHeader`).
7. **Store wall map button**: new neutral icon button top-right (replaces the empty spacer; `.sw-nav__spacer` CSS deleted). Icon is Figma's own asset (`map-24.svg`). The first copy from uds-react was a scaled-down 96px version and was replaced.
8. **Store wall avatars removed**: the 64px logo tiles on the store tiles are gone (5 removed, `.store-tile__logo` CSS deleted). The Youme Sushi friend avatars ("A B C, Ordered by 4 friends") were not removed.
9. **Liquid glass tab bar** on the Store wall: floating translucent pill (position absolute, 16px from edges, blur 20px + saturate 1.8, inner highlights, soft shadow). Feed bottom padding raised to 108px. Tab icons recoloured black (`tab-search/cart/person.svg` from `#838486` to `#161617`). Labels kept as Figma's (Home, Search, Cart, Profile). The real app has Home, Discover, Orders, Profile.
10. **Store view avatar**: real Honest Greens logo (`assets/img/honest-greens-logo.png`), cropped to 130x130 from a real-app screenshot.

### Tooling lessons
- **Figma MCP**: the selected node is often what the user means by "the selected X". Call `get_design_context` with no nodeId first. `get_metadata` on a whole canvas is huge and gets truncated to a file in `~/.local/share/opencode/tool-output/`. Grep that file for a frame name instead of reading it.
- **Nested instance IDs** (`I141:...;...`) are rejected by every Figma tool. Call `get_design_context` on the parent frame instead (for example HeaderTitle `141:37562`).
- **Avatar** instances come back only as a Code Connect snippet (Compose), with no image file. Real logos have to come from elsewhere.
- **Asset URLs** (`localhost:3845/assets/<hash>`) are fetchable with curl while the Figma file is open. Compare `md5 -q` against existing icons before adding new ones. This session reused `ai-sparkle-dark.svg` and `modal-translate.svg` that way.
- **Visual checks** without Playwright: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --window-size=390,844 --virtual-time-budget=6000 --screenshot=out.png <url>`. To drive state (click through, scroll, open a modal), write a throwaway `public/prototype/_shot.html` that is `index.html` plus an injected `<script>`, screenshot it via the dev server, then delete it. Headless Chrome clips the right edge at narrow widths, so check right-side elements in a real browser. Disable transitions in the injected page when capturing end states. `--dump-dom` with `document.title` is a quick way to read computed state.
- Python has no PIL. Use `sips -c H W --cropOffset Y X` for crops.

### Source material on disk
- Real-app screenshot supplied by the user (collapsed header, glass tab bar, "Your Picks" tiles with real logos): `~/Downloads/File (4).png` (1206x2622).
- Real store logos and tile art: `~/Desktop/Store tiles/` (for example `Honest.webp`, `McDonalds.webp`, `kfc-logo.jpg`). Use these if a higher-resolution logo is needed.
- `uds-react/src/assets/illustrations/` has category art (`asian`, `chinese`, `healthy`, `indian`, `italianChinese`, `japanese`, `pizza`, `sushi`, `vegan`, `american`, and more).

### Open items and unverified points
- Asian category art and label are guesses (Figma only shows the fifth item cut off).
- ~~Tab bar labels~~ Resolved: now Home, Discover, Orders, Profile (real app). Orders uses the uds-react `bags` icon (`tab-bags.svg`, foreground variant, 24px). Discover still uses Figma's search icon. `tab-cart.svg` is now unused.
- Glass values (tab bar and collapsed header: opacity, blur) were estimated by eye from the screenshot. The real app shows more of the photo bleeding through the top.
- Collapsed header looked faint in one headless capture. The capture with transitions off showed it correctly, so probably a timing artefact, but not confirmed in a real browser.
- Modal sheets stretch to 390px while Figma's are 360px. Figma's Translations sheet has no drop shadow, but the shared `.modal__sheet` has one.
- Store view avatar crop is low resolution (see `NOTES.md` known deltas).
- Vertical position of the Store view sparkle was not measured against Figma.
- Slide-up and fade animations were verified by computed end state only, not by watching them.

### State at end of session
- Committed and pushed in `97fb53c` (see the second session above for the follow-up work).
