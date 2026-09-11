// Decodifica header y payload de un JWT SIN verificar la firma (como jwt.io).
// Nunca usar esto para decidir si alguien está autenticado, eso lo hace el
// backend al verificar la firma; esto es solo para MOSTRAR el contenido.
export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  raw: { header: string; payload: string; signature: string };
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  // atob da binario; decodeURIComponent + escape lo pasa a UTF-8 legible (emojis/ñ).
  return decodeURIComponent(
    atob(padded)
      .split('')
      .map((char) => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  );
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const [headerPart, payloadPart, signaturePart] = parts;
    return {
      header: JSON.parse(base64UrlDecode(headerPart)),
      payload: JSON.parse(base64UrlDecode(payloadPart)),
      raw: { header: headerPart, payload: payloadPart, signature: signaturePart },
    };
  } catch {
    return null;
  }
}

/** Segundos restantes hasta que expire el token (negativo si ya expiró). */
export function secondsUntilExpiry(payload: Record<string, unknown>): number | null {
  const exp = payload.exp;
  if (typeof exp !== 'number') return null;
  return exp - Math.floor(Date.now() / 1000);
}
