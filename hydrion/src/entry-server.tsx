/**
 * Pré-rendu au build (scripts/prerender.mjs) : le HTML complet est écrit dans dist/,
 * donc le texte et les boutons d'appel s'affichent avant le JS (LCP) et même si le JS plante.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App, { type Page } from './App';

export function render(page: Page): string {
  return renderToString(
    <StrictMode>
      <App page={page} />
    </StrictMode>,
  );
}
