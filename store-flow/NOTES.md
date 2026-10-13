# Store flow prototype: working notes

Read this first when starting a new session on the prototype.

## What it is
An HTML prototype of 3 screens: Store wall -> Store view -> Product view. It has vertical scrolling, click navigation and working back navigation. It is wrapped in a Vite + React + TS site that shows it in a 390x844 device frame.

- Live: https://jordialonso1.github.io/ai-label-prototype/
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
- Only navigation is functional. Everything else is rendered but inert (class `inert`).
- Navigation: Honest Greens tile (Store wall) -> Store view. All 3 "Avocado supergreen" instances in Store view (Order again tile, Top sellers row, Honest plates row) -> Product view. Back goes Product view -> Store view -> Store wall and keeps the previous screen's scroll position.
- Fixed chrome: Store wall tab bar, Store view nav and sticky tab menu, Product view "Add" footer.
- Store view nav is transparent over the hero and turns white once scrolled (`.is-scrolled`, wired in the nav JS). This is an addition, not in Figma.
- Hidden Figma layers are not rendered (PrimePromoLoyalty, hidden tabs, hidden quantifier). The Store view snackbar is outside the frame, so it is left out.

## Known deltas against Figma (candidates for the next iterations)
1. Store logos are flat-colour initials tiles with invented colours (logos were not downloadable).
2. Category carousel on Store wall uses plain grey circles. The "Asian" label is invented.
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
