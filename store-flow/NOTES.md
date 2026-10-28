# Store flow prototype: working notes

Read this first when starting a new session on the prototype. Session-by-session context (what changed, tooling lessons, open questions) lives in `NOTES-HISTORY.md`.

## What it is
An HTML prototype of 3 screens: Store wall -> Store view -> Product view. It has vertical scrolling, click navigation and working back navigation. It is wrapped in a Vite + React + TS site that shows it in a 390x844 device frame.

- Live: https://jordialonso1.github.io/ai-label-prototype/
- Wrapper page never scrolls: `.page` is `100svh` with `overflow: hidden`, and `src/App.tsx` scales the 390x844 device down (`transform: scale`, never up, minimum 0.3) so it fits the viewport height and width. The prototype inside keeps its real 390x844 layout.
- Prototype only (no frame): `/prototype/index.html`
- Deploys automatically on every push to `main` that touches `store-flow/**` (`.github/workflows/deploy-store-flow.yml`).

## Layout
- `public/prototype/index.html`: the whole prototype (CSS, markup and nav JS in one file).
- `public/prototype/assets/icons`, `assets/img`: assets downloaded from Figma.
- `public/prototype/fonts/`: Glovo Sans woff2 files. Never base64 them.
- `src/App.tsx`, `src/app.css`: the wrapper page with the iframe device frame.
- Scripts: `npm run dev`, `lint`, `typecheck`, `build`.
- Do not touch `ux-tools/` or `uds-react/` (gitignored, read-only references).

## Figma source
- File `o5hlNXYETBlqwXNvOSSQUa`, canvas node `140:22973`.
- Frames (402px wide in Figma): Store wall `141:29412`, Store view `141:29225`, Product view `141:37235`.
- The Figma desktop app must have this file active. If node IDs return "not found", ask the user to switch back. Do not use the `2648:` "Product page" frame.
- `get_design_context` returns React + Tailwind. Convert it to plain HTML/CSS (no Tailwind).
- Fetch large frames per sublayer with `excludeScreenshot: true`, because outputs get truncated.
- Instance IDs with an `I...;...` prefix are rejected.

## Assets
- Figma asset URLs (`http://localhost:3845/assets/<hash>`) expire, so save assets locally.
- Before downloading, compare `md5 -q` of the file against the existing files in `icons/` and `img/`. Download only when nothing matches. Don't guess names.

## Conventions and decisions
- Context docs (read-only): `ux-tools/src/AI Prototyping Context V2/` (`Pintxo.md`, `tokens-cheatsheet.md`, `prototype-boilerplate.html`). Do not use V1.
- Keep the `@font-face` blocks identical to the boilerplate. Keep `<html data-theme="core" data-ui-mode="light">` and `lang="en"`. Use `pintxo-typography-*` classes and cheatsheet tokens.
- Width is 390px (Pintxo), not Figma's 402px. Content reflows.
- Follow Pintxo and Figma inside the prototype (light theme, Glovo Sans). The dark / JetBrains Mono rules in AGENTS.md do not apply here.
- Typography: Figma / uds-react sizes override the Pintxo boilerplate (title1 28/32, title2 24/28, title3 21/24, callout1 16/20, callout2 14/20 bold, body 16/20 and 14/20, caption 12/16). They are applied in an override `<style>` block.
- "Highlight AI labels" checkbox (wrapper `src/App.tsx`): posts `{ type: 'highlight-ai', value }` to the iframe, and the prototype toggles `html.highlight-ai`. Style comes from Figma `196:75575` (pulse): detached ring around each `[data-ai-label]` element with a 10% tint inside, recoloured from Figma's magenta to the UDS brand secondary green (`--brand-color-secondary`, `rgba(0, 158, 129, 1)`). The ring pulses (`@keyframes ai-pulse`, 1.6s: ring grows 3px and fades to 70%). Notice banner uses a 6px ring (as in Figma), icon-only sparkles a round 4px ring, tags 4px. The pulse animation itself is not in Figma (no motion data), so timing and growth are my choice. While highlighting, the tiles' and banners' `overflow: hidden` is lifted so the ring is not clipped, and their images get their own border-radius (store tile photo, lunch banner image, Domino's banner media) so the corners stay round. Static ring under `prefers-reduced-motion`. When adding a new AI label (sparkle, Enhanced tag, AI notice), add `data-ai-label="<name>"` to it. This only exists on the wrapper page, so the standalone `/prototype/index.html` has no control for it.
- "Reference image" checkbox (wrapper, under the highlight checkbox): posts `{ type: 'reference-image', value }`, and the prototype swaps the text of every `[data-tag-text]` span from "Enhanced" to its `data-tag-text-reference` ("Reference"). The 3 Enhanced tags (lunch banner, Ad modal, Product image) carry it. New "Enhanced" tags need the same span. The state is resent when the iframe reloads.
- "Product view AI content" dropdown (wrapper, `ContentDropdown` in `src/App.tsx`): a button that opens a checkbox list (Images, Descriptions, Dietary tags, Translations, all ticked by default; closes on outside click or Esc). The wrapper posts `{ type: 'ai-content', screen: 'product-view', value: ['images', ...] }`. The prototype rewrites the footer banner (`[data-ai-content="product-view"]`, copy in `[data-ai-content-copy]`) to "<List> are generated with AI" (items always in the order images, descriptions, dietary tags, translations; "a, b and c"; first letter capitalised; matches Figma `160:38148`), and hides the banner when nothing is ticked. The Store view footer banner and its dropdown were removed (Figma `141:37985` is hidden). Options are defined per screen in `AI_CONTENT_SCREENS`. A hidden label (`hidden` attribute) is skipped by the stepper, so the total drops from 8 to 7 when the banner is hidden. The dropdown only drives the footer banner, not the Translations row, the Image tags or the sparkles.
- AI label stepper (wrapper `src/App.tsx`, under the checkbox): prev/next arrows with an "n / total" counter, the label name and its screen. The wrapper posts `{ type: 'focus-ai-label', index }`; the prototype switches screen, opens the label's modal when it is inside one (Ad modal, Translations dropdown), or smooth-scrolls it to the centre, then replies `{ type: 'ai-labels', total, index, screen, name }`. Order is document order of `[data-ai-label]`, wrapping at both ends. A label can carry `data-ai-after="<name of another label>"` to be placed right after it ("Ads featured banner label", the Ad modal tag, follows "Ads featured banner icon", although its markup sits at the end of the Store wall). Each label needs a name: `data-ai-label="Some name"` (current names: Store tile icon, Ads featured banner icon, Ads featured banner label, Ads full width featured banner label, Header image icon, Footer banner for multiple generated content (Product view), Content translations, Image label). Ticking the checkbox jumps straight to the first label. The stepper is only shown while the highlight checkbox is ticked (the prototype keeps its current screen when it is hidden).
- Only navigation and the modal sheets are functional. Everything else is rendered but inert (class `inert`).
- Modal sheets: `.modal` overlay inside the screen it belongs to (Ad modalsheet on Store wall `#ad-modal`, Translations dropdown on Store view `#translations-modal`). Open with `data-modal-open="<id>"`, close with `[data-modal-close]` or Esc. Scrim fades and the sheet slides up (0.35s / 0.4s, respects `prefers-reduced-motion`). To add a sheet, copy the `.modal` markup and the CSS is reused.
- Store wall header collapses on scroll (`#sw-sticky`, toggled in the nav JS once `#sw-search` scrolls under the status bar): translucent blur header with back, "Search in Food", map button and the chips. Behaviour taken from a real-app screenshot, not from Figma.
- Store wall tab bar is a floating "liquid glass" pill (translucent, backdrop blur, inner highlights). Taken from the real-app screenshot. Glass values were estimated by eye. `.sw-feed` bottom padding (108px) clears it.
- Navigation: Honest Greens tile (Store wall) -> Store view. All 3 "Avocado supergreen" instances in Store view (Order again tile, Top sellers row, Honest plates row) -> Product view. Back goes Product view -> Store view -> Store wall and keeps the previous screen's scroll position.
- Fixed chrome: Store wall tab bar (floating glass) and collapsed header, Store view nav and sticky tab menu, Product view "Add" footer.
- Store view nav is transparent over the hero and turns white once scrolled (`.is-scrolled`, wired in the nav JS). This is an addition, not in Figma.
- Store view header: the AI sparkle is icon-only (no "Enhanced" text), right-aligned under the chevron. The hero is 288px (Figma `141:37557`), and the bottom gradient block (`.sv-hero__info`, Figma `141:37561`) is exactly 128px starting at y=160, with 32px vertical padding. The sparkle is absolutely positioned (right 16px, top 96px in that block = Figma x=370, y=256) so it does not change the block height. Content below the hero sits 12px higher than before, matching Figma (logistics at y=268). The 10px blur of that block is masked to fade in with the gradient (`.sv-hero__info::before`), because full-strength blur from the top edge showed a hard line across the photo.
- Store view nav buttons: back, search, translate and more are all floating icon buttons (white, 1px border). Translate opens the Translations dropdown.
- Store wall tiles have no logo/avatar overlay (removed in the latest Figma). The Youme Sushi "ordered by friends" avatars are still in Figma and kept.
- Hidden Figma layers are not rendered (PrimePromoLoyalty, hidden tabs, hidden quantifier). The Store view snackbar is outside the frame, so it is left out.

## Known deltas against Figma (candidates for the next iterations)
1. Store view avatar is a 130x130 crop of the real Honest Greens logo from a real-app screenshot (soft on retina). Figma exposes the avatar only as a Code Connect snippet. Replace with a proper export if available.
2. Category carousel on Store wall uses uds-react illustrations copied to `assets/img/cat-*.svg` (backgrounds stripped). The fifth item "Asian" is a guess (Figma shows it cut off).
3. Status bar time uses a system font stack (Figma uses SF Pro, not provided).
4. Store view traits row shows only the rating (Figma rotates through 4 rows).
5. Honest plates reuses the Top sellers rows (Figma uses the same items).
6. Product view stepper icons come from uds-react `plus.svg` / `minus.svg` (Figma exposes the counter only as a code snippet).
7. Visual comparison with Figma was by eye. Vertical spacing of the Product view info block was not measured against the 1156px frame.

## Definition of done for a change
- Console clean in a browser.
- `npm run lint`, `npm run typecheck` and `npm run build` pass.
- Each changed screen checked against its Figma frame, with deltas reported.
- No files touched outside `store-flow/`.
- Do not commit or push unless the user asks. Pushing to `main` triggers a public deploy.
