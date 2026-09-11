// El script de Google Identity Services se carga con `defer` y puede no estar
// listo cuando el componente se monta; este helper espera a que exista antes de inicializar.

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function waitForGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        resolve();
        return;
      }
      if (Date.now() - start > 5000) {
        clearInterval(interval);
        reject(new Error('No se pudo cargar el script de Google'));
      }
    }, 50);
  });
}

/**
 * Inicializa Google Identity Services y dibuja el botón dentro de `container`.
 * Sin VITE_GOOGLE_CLIENT_ID configurado, no hace nada.
 */
export async function renderGoogleButton(container: HTMLElement, onCredential: (credential: string) => void) {
  if (!GOOGLE_CLIENT_ID) return;

  await waitForGoogleScript();

  window.google!.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onCredential(response.credential),
  });

  window.google!.accounts.id.renderButton(container, {
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: 320,
  });
}

export const isGoogleSignInEnabled = Boolean(GOOGLE_CLIENT_ID);
