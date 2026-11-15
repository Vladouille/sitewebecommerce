import { useSyncExternalStore } from 'react';

/**
 * « Dock d'appel » = le bouton d'appel de secours (barre sticky mobile / pastille desktop).
 * Il devient visible dès que les CTA du hero sortent de l'écran.
 * Le header n'a le droit de se cacher QUE si le dock est visible :
 * le numéro de téléphone reste ainsi visible à tout moment (règle de conversion n°1).
 */
let dockVisible = false;
const listeners = new Set<() => void>();

export function setDockVisible(v: boolean) {
  if (v === dockVisible) return;
  dockVisible = v;
  listeners.forEach((l) => l());
}

export function useDockVisible(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => dockVisible,
    () => false,
  );
}
