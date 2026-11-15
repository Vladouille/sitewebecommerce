import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App, { type Page } from './App';
import './styles/index.css';

/** Hydrate le HTML pré-rendu au build ; en dev (pas de pré-rendu), rendu classique. */
export function mount(page: Page) {
  const el = document.getElementById('root')!;
  const tree = (
    <StrictMode>
      <App page={page} />
    </StrictMode>
  );
  if (el.firstElementChild) hydrateRoot(el, tree);
  else createRoot(el).render(tree);
}
