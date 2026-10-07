# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Despliegue estático en Netlify (SSG)

Esta herramienta no necesita un servidor en producción: los archivos Excel y PDF
se procesan en el navegador. Mantenemos el renderizado de Nuxt para generar el HTML
durante el build, no en cada visita (no usamos `ssr: false`).

`netlify.toml` configura el despliegue con:

- **Build command:** `pnpm generate`
- **Publish directory:** `.output/public`

Para comprobar la versión estática localmente:

```bash
pnpm generate
pnpm preview
```

Publica el directorio `.output/public` completo, incluidas las plantillas de `public/`.
Los cambios en la configuración, las fechas o las plantillas requieren un nuevo
despliegue. La librería PDF se carga solo al generar documentos y SheetJS solo al
leer un archivo Excel. Desactivamos el prefetch de módulos opcionales para que
Nuxt no los descargue de fondo al abrir esta página de una sola ruta; los recursos
críticos siguen precargándose.
