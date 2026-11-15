import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { brand, seo } from './src/content';

const escapeAttr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Injecte les métadonnées SEO de src/content.ts dans le HTML statique (lu par Google sans JS). */
function seoFromContent(): Plugin {
  const tokens: Record<string, string> = {
    __HX_TITLE__: seo.title,
    __HX_DESCRIPTION__: seo.description,
    __HX_SITE_URL__: seo.siteUrl.replace(/\/$/, ''),
    __HX_BRAND__: brand.name,
    __HX_ROBOTS__: seo.indexable ? 'index, follow' : 'noindex, nofollow',
  };
  return {
    name: 'hydrion-seo',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        Object.entries(tokens).reduce((acc, [k, v]) => acc.split(k).join(escapeAttr(v)), html),
    },
  };
}

// base './' : le dossier dist/ fonctionne à la racine d'un domaine
// comme dans un sous-dossier (ex. monportfolio.fr/hydrion/).
export default defineConfig({
  base: './',
  plugins: [react(), seoFromContent()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 0, // les polices restent des fichiers (cache + preload)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mentions: resolve(__dirname, 'mentions-legales.html'),
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
