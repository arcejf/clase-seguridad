import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/auth/use-auth';
import { apiFetchRaw } from '@/lib/api-client';
import * as postsApi from '@/api/posts.api';

// Esta página le pega a la API DIRECTO, salteándose a propósito los helpers
// normales, para mostrar que lo único que autoriza o rechaza es el backend.

interface RawResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
}

async function toRawResult(response: Response, headerNames: string[] = []): Promise<RawResult> {
  const headers: Record<string, string> = {};
  for (const name of headerNames) {
    const value = response.headers.get(name);
    if (value) headers[name] = value;
  }
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    body = await response.clone().text();
  }
  return { status: response.status, statusText: response.statusText, headers, body };
}

function ResultBlock({ result }: { result: RawResult | string }) {
  if (typeof result === 'string') {
    return <p className="text-sm text-muted-foreground">{result}</p>;
  }
  const isSuccess = result.status >= 200 && result.status < 300;
  return (
    <div className="rounded-md border bg-muted/40 p-3 font-mono text-xs">
      <div className="mb-2 flex items-center gap-2">
        <Badge variant={isSuccess ? 'secondary' : 'destructive'}>
          {result.status} {result.statusText}
        </Badge>
      </div>
      {Object.entries(result.headers).length > 0 && (
        <pre className="mb-2 whitespace-pre-wrap text-muted-foreground">
          {Object.entries(result.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')}
        </pre>
      )}
      <pre className="whitespace-pre-wrap break-all">{JSON.stringify(result.body, null, 2)}</pre>
    </div>
  );
}

function DemoCard({
  title,
  defense,
  description,
  children,
  onRun,
  runLabel = 'Probar',
  result,
}: {
  title: string;
  defense: string;
  description: ReactNode;
  children?: ReactNode;
  onRun?: () => void;
  runLabel?: string;
  result?: RawResult | string | null;
}) {
  const hasResult = result !== undefined && result !== null;

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {(children || hasResult) && (
        <CardContent className="flex flex-col gap-3 px-4">
          {children}
          {hasResult && <ResultBlock result={result} />}
        </CardContent>
      )}
      <CardFooter className="flex items-center justify-between px-4">
        <code className="text-xs text-muted-foreground">{defense}</code>
        {onRun && <Button onClick={onRun}>{runLabel}</Button>}
      </CardFooter>
    </Card>
  );
}

const TAMPERED_CURL = `curl -i http://localhost:3000/api/auth/me \\
  -H "Cookie: accessToken=PEGÁ_ACÁ_TU_TOKEN_CON_LA_FIRMA_CAMBIADA"`;

export function SecurityDemoPage() {
  const { user } = useAuth();

  const [noTokenResult, setNoTokenResult] = useState<RawResult | string | null>(null);
  const [idorResult, setIdorResult] = useState<RawResult | string | null>(null);
  const [refreshResult, setRefreshResult] = useState<RawResult | string | null>(null);
  const [bruteForceResult, setBruteForceResult] = useState<RawResult | string | null>(null);
  const [bruteForceLog, setBruteForceLog] = useState<string[]>([]);
  const [massAssignmentResult, setMassAssignmentResult] = useState<RawResult | string | null>(null);

  async function runNoToken() {
    const response = await apiFetchRaw('/api/auth/me', { credentials: 'omit' });
    setNoTokenResult(await toRawResult(response));
  }

  async function runIdor() {
    setIdorResult('Buscando un post que no sea tuyo...');
    try {
      const { posts } = await postsApi.listPosts();
      const foreignPost = posts.find((p) => p.author.id !== user?.id);
      if (!foreignPost) {
        setIdorResult('No encontré ningún post ajeno en el feed para probar esto. Publicá uno con otro usuario primero.');
        return;
      }
      const response = await apiFetchRaw(`/api/posts/${foreignPost.id}`, { method: 'DELETE' });
      setIdorResult(await toRawResult(response));
    } catch {
      setIdorResult('No se pudo cargar el feed para buscar un post ajeno.');
    }
  }

  async function runForceRefresh() {
    const response = await apiFetchRaw('/api/auth/refresh', { method: 'POST', skipAuth: true });
    const raw = await toRawResult(response);
    setRefreshResult(raw);
    if (response.ok) {
      toast.success(
        'Se emitió un access token nuevo (cookie httpOnly, no se puede mostrar acá). Mirá el header Set-Cookie en Network, o el nuevo valor en Application → Cookies.',
      );
    }
  }

  async function runBruteForce() {
    setBruteForceLog([]);
    setBruteForceResult('Mandando 6 logins seguidos con una contraseña incorrecta...');
    const attempts: string[] = [];
    let lastResponse: Response | null = null;
    for (let i = 1; i <= 6; i++) {
      const response = await apiFetchRaw('/api/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: { email: 'nadie-existe@example.com', password: 'contraseña-incorrecta' },
      });
      attempts.push(`Intento ${i}: ${response.status} ${response.statusText}`);
      setBruteForceLog([...attempts]);
      lastResponse = response;
    }
    if (lastResponse) {
      setBruteForceResult(
        await toRawResult(lastResponse, ['RateLimit-Policy', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After']),
      );
    }
  }

  async function runMassAssignment() {
    const suffix = Date.now();
    const response = await apiFetchRaw('/api/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: {
        email: `demo-${suffix}@example.com`,
        username: `demo${suffix}`,
        displayName: 'Cuenta de demo',
        password: 'ContraseñaDemo123!',
        // "role" no existe en registerSchema (backend/domain/user.ts); Zod lo descarta.
        role: 'admin',
        isAdmin: true,
      },
    });
    setMassAssignmentResult(await toRawResult(response));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Panel de seguridad</h1>
        <p className="text-sm text-muted-foreground">
          Cada botón le pega directo a la API (sin pasar por la UI normal) para mostrar qué defensa del backend entra
          en juego. El código de cada una está en <code className="text-xs">backend/</code>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dónde vive tu access token ahora</CardTitle>
          <CardDescription>
            El access token es HttpOnly: JavaScript de esta página ya no puede leerlo (por eso esta card ya no lo
            puede decodificar como antes). Es la misma protección que ya tenía el refresh token, aplicada ahora
            también al access token.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
            <li>
              Abrí DevTools (F12) → pestaña <strong>Application</strong> → <strong>Cookies</strong> → este origen.
            </li>
            <li>
              Buscá la cookie <code className="text-xs">accessToken</code> (al lado de{' '}
              <code className="text-xs">refreshToken</code>, que ya se inspeccionaba ahí).
            </li>
            <li>
              Copiá su <em>Value</em> y pegalo en{' '}
              <a href="https://jwt.io" target="_blank" rel="noreferrer" className="underline">
                jwt.io
              </a>{' '}
              para ver header y payload.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Esto es exactamente lo que tendría que hacer un atacante con acceso a DevTools (o a un XSS con acceso al
            DOM pero no a cookies HttpOnly): puede ver que la cookie existe y su valor crudo en DevTools, pero{' '}
            <code>document.cookie</code> nunca la va a devolver.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-base">1. Token manipulado</CardTitle>
          <CardDescription>
            Esto ya no se puede probar con un botón: el access token es HttpOnly (esta página no puede leerlo ni
            mandar un Cookie header a mano) y el backend ya no acepta Authorization, solo la cookie. Pero un cliente
            que no sea el navegador — como <code>curl</code> — sí puede mandar cualquier Cookie header que quiera.
            HttpOnly es una restricción de JS/DOM, no del protocolo HTTP. Probalo vos:
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4">
          <ol className="list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
            <li>
              Copiá tu <code className="text-xs">accessToken</code> desde Application → Cookies (ver la card de
              arriba).
            </li>
            <li>Cambiale el último carácter (por ejemplo, por una x).</li>
            <li>Pegalo en el comando de abajo, en tu terminal:</li>
          </ol>
          <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">{TAMPERED_CURL}</pre>
          <p className="text-xs text-muted-foreground">Deberías ver 401 — la firma ya no cuadra contra JWT_SECRET.</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-4">
          <code className="text-xs text-muted-foreground">backend/lib/tokens.ts: verifyAccessToken()</code>
        </CardFooter>
      </Card>

      <DemoCard
        title="2. Sin token"
        description="Pegamos a /api/auth/me pidiéndole al navegador que no mande ninguna cookie en este request (aunque estés logueado)."
        defense="backend/middlewares/require-auth.ts"
        onRun={runNoToken}
        result={noTokenResult}
      />

      <DemoCard
        title="3. IDOR: borrar un post ajeno"
        description="Buscamos en el feed un post que NO sea tuyo y mandamos el DELETE igual, con tu token real."
        defense="backend/services/post.service.ts: chequeo de ownership"
        onRun={runIdor}
        result={idorResult}
      />

      <DemoCard
        title="4. Forzar un refresh"
        description="Llama a /api/auth/refresh con la cookie httpOnly. Se emite un access token nuevo (no se puede mostrar su valor acá, es HttpOnly) y el refresh token usado queda revocado (probá forzarlo dos veces con el mismo token viejo y vas a ver un 401)."
        defense="backend/services/auth.service.ts: rotación y revocación"
        onRun={runForceRefresh}
        result={refreshResult}
      />

      <DemoCard
        title="5. Fuerza bruta en el login"
        description="6 intentos de login seguidos con una contraseña incorrecta. El límite real es configurable por .env (ver AUTH_RATE_LIMIT_MAX en backend/.env.example)."
        defense="backend/middlewares/rate-limit.ts"
        onRun={runBruteForce}
        result={bruteForceResult}
      >
        {bruteForceLog.length > 0 && (
          <pre className="rounded-md border bg-muted/40 p-3 font-mono text-xs">{bruteForceLog.join('\n')}</pre>
        )}
      </DemoCard>

      <DemoCard
        title="6. Mass assignment en el registro"
        description='Registramos una cuenta de prueba con "role":"admin" e "isAdmin":true de más en el body.'
        defense="backend/middlewares/validate.ts + backend/domain/user.ts: Zod descarta lo no declarado"
        onRun={runMassAssignment}
        result={massAssignmentResult}
      />
    </div>
  );
}
