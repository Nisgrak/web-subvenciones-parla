// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-05-01',
  devtools: { enabled: true },
  routeRules: {
    '/': { prerender: true }
  },
  hooks: {
    'build:manifest'(manifest) {
      // Esta web tiene una sola ruta: los módulos opcionales se descargan al usarlos.
      // Mantener los modulepreload críticos, pero evitar prefetch de PDF y Excel.
      for (const chunk of Object.values(manifest)) {
        chunk.prefetch = false
      }
    }
  },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/eslint'
  ]
})
