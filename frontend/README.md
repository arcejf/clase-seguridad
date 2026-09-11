# Frontend, red social mínima (proyecto didáctico de seguridad)

Este es el cliente React de [`backend/`](../backend): login, registro, feed, posts,
comentarios, likes, y una ruta `/seguridad` que armamos como panel de demo: le pega
directo a la API para mostrar en vivo, con la respuesta HTTP cruda en pantalla, cada
defensa que tiene el backend. Como en el backend, en los comentarios del código
explicamos el por qué de cada decisión.

## Arranque rápido

Requisito: el backend corriendo en `http://localhost:3000` (ver `backend/README.md`).

```bash
npm install
npm run dev   # http://localhost:5173
```

No hace falta crear un `.env`: el código ya apunta a `http://localhost:3000` por
default. Solo hace falta un `.env` si tu backend corre en otro puerto/host, copiá
`.env.example` a `.env` y cambiá `VITE_API_URL`.

Usuarios de prueba (creados por el seed del backend): `martina.duarte@gmail.com`,
`joaquin.pereyra@gmail.com` y `camila.sosa@gmail.com`, contraseña `Clase2026!` para
los tres.

## Login con Google

Para que el botón de Google aparezca en `/login` y `/register` hace falta un
`VITE_GOOGLE_CLIENT_ID` con el mismo Client ID que `GOOGLE_CLIENT_ID` en el backend
(ver `backend/README.md`, sección "Login con Google"). Sin esa variable, el botón
simplemente no se dibuja y el login por contraseña sigue funcionando igual.

## Stack

- **React 19 + Vite + TypeScript**
- **Tailwind v4** (`@tailwindcss/vite`, sin archivo de config) **+ shadcn/ui**
- **React Router v7** (declarativo: `BrowserRouter`/`Routes`/`Route`)
- **react-hook-form + Zod** para los formularios
- **Google Identity Services** (script cargado en `index.html`) para el login con Google

## Las cuatro piezas que sostienen la sesión

1. **`lib/token-store.ts`**: guardamos el access token en una variable de módulo, en
   memoria, nunca en `localStorage`. Esto no es inmunidad a XSS (un script que corre en
   la página puede leer cualquier variable), pero reduce el daño: no persiste entre
   recargas ni pestañas, y no es tan trivial de exfiltrar como un storage completo.
2. **`lib/api-client.ts`**: es un `fetch` central que manda siempre la cookie
   (`credentials: 'include'`), agrega el `Authorization: Bearer`, y ante un 401 intenta
   un refresh y reintenta el request una vez. El refresh es single-flight: como el
   backend rota el refresh token en cada uso, dos refrescos en paralelo harían que el
   segundo llegue con un token que el primero ya revocó, así que dejamos que todo el que
   necesite refrescar espere la misma promesa compartida.
3. **`auth/auth-context.tsx`**: al montar la app, hacemos un único intento de
   `/auth/refresh` para recuperar la sesión a partir de la cookie `httpOnly` (el access
   token en memoria se pierde en cada F5, pero la cookie sobrevive). Con React
   StrictMode duplicando efectos en desarrollo, y con la posibilidad de que un login
   manual resuelva antes que ese refresh de arranque, agregamos una guarda explícita
   para que un resultado de bootstrap que llega tarde nunca pise una sesión ya
   establecida por otra vía.
4. **`auth/ProtectedRoute.tsx`**: acá está la lección central del frontend, esto es UX,
   no seguridad. Esconde una página y redirige a `/login`, pero cualquiera puede
   saltarlo con curl, editando el estado en React DevTools, o con JS deshabilitado. Lo
   que protege de verdad son `requireAuth` y los chequeos de ownership del backend; el
   panel de `/seguridad` lo prueba a propósito saltándose esta UI.

## Estructura

```
src/
  main.tsx, App.tsx          # bootstrap y tabla de rutas
  auth/                      # contexto de sesión, ProtectedRoute, PublicOnlyRoute
  lib/                       # api-client (fetch + refresh), token-store, jwt, google-signin, utils
  api/                       # auth.api.ts, posts.api.ts, users.api.ts
  schemas/                   # espejo de los schemas Zod del backend
  types/api.ts               # espejo de los DTOs del backend
  components/                # PostCard, PostComposer, CommentList, GoogleSignInButton, ui/ (shadcn)
  pages/                     # incluye SecurityDemoPage.tsx, el panel de /seguridad
```

## Rutas

| Ruta | Acceso |
|---|---|
| `/login`, `/register` | solo sin sesión |
| `/` (feed), `/post/:id`, `/u/:username`, `/ajustes`, `/seguridad` | requieren sesión |

## El panel de `/seguridad`

Cada botón pega directo a la API (no pasa por `api/*.ts` ni por la UI protegida) y
muestra el status HTTP y el body tal cual responde el backend:

1. **Token manipulado** → 401 (se le cambia la firma a un token real)
2. **Sin token** → 401
3. **IDOR**: borrar un post ajeno con tu propio token → 403
4. **Forzar un refresh** → rota el access token en vivo
5. **Fuerza bruta en el login**: 6 intentos seguidos → 429 + cabeceras `RateLimit-*`
6. **Mass assignment**: registro con `"role":"admin"` de más → se descarta solo

Ojo: el punto 5 consume el límite real de `/auth/login` (compartido con el registro y
con Google), así que si el punto 6 te da 429, es porque acabás de correr el 5. Podés
esperar la ventana, reiniciar el backend (el contador vive en memoria), o subir
`AUTH_RATE_LIMIT_MAX` en el `.env` del backend para la demo.

## Notas de seguridad adicionales

- **`.env` de frontend**: `VITE_API_URL` y `VITE_GOOGLE_CLIENT_ID` pueden tener un
  default o quedar vacíos sin riesgo, porque todo lo que empieza con `VITE_` termina
  dentro del bundle de JS. Por eso nunca es el lugar para un secreto (compará con
  `JWT_SECRET` en el backend, que nunca tiene default).
- **XSS**: `PostCard`/`CommentList` interpolan el contenido como texto, y React lo
  escapa por default. Podés probar postear `<script>alert(1)</script>` y vas a ver que
  se muestra como texto, no que se ejecuta.
- **Validación cliente vs. servidor** (`schemas/*.ts`): son un espejo de
  `backend/domain/*.ts` para dar feedback inmediato en el formulario. La que protege de
  verdad es la del servidor: si mandás un body inválido con curl, vas a ver el 400
  igual, sin pasar por acá.
- **El ID token de Google nunca se decodifica ni se confía en el cliente**: el frontend
  solo lo reenvía tal cual a `POST /api/auth/google`. Toda la verificación (firma,
  issuer, audience, expiración) pasa en el backend, con `google-auth-library`.

## Scripts

```bash
npm run dev     # servidor de desarrollo
npm run build   # tsc -b && vite build
npm run lint    # eslint .
```

## Fuera de alcance

2FA, verificación de email, roles/admin, tests automatizados: mismas ideas que en el
README del backend.
