# HYDRION — site vitrine plombier (démo portfolio)

Vite + React 18 + TypeScript + Tailwind. HTML pré-rendu au build, sortie 100 % statique dans `dist/`.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/ (pré-rendu inclus)
npm run preview   # sert dist/ sur http://localhost:4173
```

- Contenu (nom, téléphone, textes, prix) : `src/content.ts`
- Couleurs et typographies : `tailwind.config.ts`
- Tracking (`click_call`, `start_quote`…) : `src/lib/analytics.ts`
- Décisions et avancement : `PLAN.md`

⚠️ Déploiement : on publie **le contenu de `hydrion/dist/`**, jamais le dossier `hydrion/` lui-même
(et jamais dans le `public_html` d'Autoflow). Le README complet (Netlify, Vercel, OVH, Hostinger) arrive en phase 8.
