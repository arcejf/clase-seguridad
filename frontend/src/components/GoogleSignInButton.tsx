import { useEffect, useRef } from 'react';
import { isGoogleSignInEnabled, renderGoogleButton } from '@/lib/google-signin';

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    renderGoogleButton(containerRef.current, onCredential).catch(() => {
      // Si el script de Google no llegó a cargar (red lenta, bloqueado por
      // un adblock, etc.), el botón simplemente no aparece. El login por
      // contraseña sigue funcionando igual.
    });
  }, [onCredential]);

  if (!isGoogleSignInEnabled) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} className="flex justify-center" />
      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
