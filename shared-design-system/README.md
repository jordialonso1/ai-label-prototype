# shared-design-system

Components and global styles shared by every prototype in this repo.

- `styles/base.css`: reset, page background, default font. Import once per prototype's `main.tsx`.
- `components/`: `Button` (variants `default`, `primary`, `icon`) and `Checkbox`.
- `index.ts`: barrel export. Use `import { Button } from '@shared'`.

`@shared` is an alias for this folder (set in `vite.config.ts` and `tsconfig.app.json`).
