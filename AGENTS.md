# AGENTS.md

## Commands

- Use `pnpm` for this repo; `package.json` pins `pnpm@9.15.4` and `pnpm-lock.yaml` is committed.
- `pnpm install` runs `nuxt prepare` via `postinstall`; rerun `pnpm exec nuxt prepare` if `.nuxt/` generated types/config are missing.
- Dev server: `pnpm dev` on `http://localhost:3000`.
- Production check: `pnpm build`; static output check: `pnpm generate`; local production preview: `pnpm preview` after build/generate.
- Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test` (node test runner over `tests/*.test.ts`).

## Project Shape

- This is a Nuxt 3 app, not Nuxt 4; root files are `app.vue`, `pages/index.vue`, `composables/`, `utils/`, and `types/`.
- `app.vue` only wraps `NuxtPage` in `UApp`; the real UI and orchestration live in `pages/index.vue`.
- There is no backend implementation currently; `server/tsconfig.json` only extends Nuxt-generated server types.
- Nuxt modules in use: `@nuxt/ui`, `@nuxt/icon`, `@nuxt/fonts`, and `@nuxt/eslint`; global CSS is `assets/css/main.css` with Tailwind and Nuxt UI imports.

## Domain Couplings

- The app generates Parla subsidy PDFs from CSV data entirely in the browser using `pdf-lib` and Blob URLs.
- `public/Anexo III.pdf` is loaded at runtime by exact URL `/Anexo III.pdf`; field names and row limits are defined in `app.config.ts` under `pdfTemplate`. Keep the PDF asset and config in sync.
- The invoice file can be Excel (`.xlsx`/`.xls`/`.ods`, read lazily with SheetJS in `app/utils/spreadsheetUtils.ts`) or CSV; both go through `parseInvoiceRows` in `app/utils/csvUtils.ts`.
- `public/Facturas Subvención - Plantilla.csv` is the source template; `public/Facturas Subvención - Plantilla.xlsx` is generated from it with `pnpm template:xlsx`. Column titles and accepted aliases (old `#`/`Número`) live in `csvColumns`. Update the CSV, `csvColumns` and regenerate the Excel when changing columns.
- Valid invoice dates come from `app.config.ts` `invoiceDateRange` and are currently strings in `DD/MM/YYYY` format.
- Optional invoice PDF merging depends on the browser File System Access API (`window.showDirectoryPicker`), so it works only in compatible browsers such as Chrome/Edge.
- `Nº orden` may repeat only across different invoice years (parser warns via `sharedNumbers`); those invoices use `facturaAA-NNN.pdf` (2-digit year + padded `Nº orden`). Any invoice is also found as `facturaAA-NNN.pdf`. Invoice keys/filenames come from `getInvoiceKey`/`getExpectedInvoiceFileName`/`getAcceptedInvoiceFileNames` in `app/utils/fileUtils.ts`.
- Invoice attachment filenames must be `facturaNNN.pdf`, where `NNN` is the zero-padded `Nº orden` value from `utils/fileUtils.ts` `formatInvoiceNumber`.

## Implementation Notes

- Keep browser-only APIs (`window`, `FileReader`, `FileSystemDirectoryHandle`, `URL.createObjectURL`) inside client-executed code paths; SSR/build must not touch them at module evaluation time.
- PDF field filling is intentionally tolerant: missing PDF fields log warnings in `utils/pdfUtils.ts` instead of failing every row.
- Generated Blob URLs are manually revoked in `pages/index.vue`/composables; preserve cleanup when changing generation flows.
