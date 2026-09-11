// Pub-sub mínimo para que api-client.ts avise a auth-context.tsx que el refresh
// falló, sin que ambos módulos se importen entre sí.
type Listener = () => void;
const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionExpired(): void {
  for (const listener of listeners) listener();
}
