# JWT (JSON Web Tokens)

## ¿Qué es?

Un formato de token compuesto por tres partes (header, payload y firma) separadas por puntos, codificadas en base64. La firma garantiza que el contenido no fue modificado, pero el payload es legible por cualquiera que tenga el token (base64 no es cifrado).

## ¿Para qué sirve?

Para que el server pueda confirmar "quién hace este request" sin tener que guardar sesiones en memoria/base de datos: toda la información necesaria para validarlo (excepto el secreto) va en el propio token.

## ¿Cómo funciona?

1. El server firma un token con un secreto (`JWT_SECRET`) que solo él conoce.
2. El cliente lo guarda y lo manda en cada request (típicamente en el header `Authorization: Bearer <token>`).
3. El server verifica la firma con el mismo secreto: si alguien modificó el payload (o lo firmó con otro secreto), la verificación falla.
4. **Firmado ≠ cifrado**: firmar garantiza *integridad* (nadie lo puede alterar sin que se note), no *confidencialidad* (cualquiera puede leer el payload pegándolo en jwt.io). Por eso nunca hay que poner datos sensibles adentro.

## Autenticación y Autorización

- Un JWT válido dice **quién sos** (autenticación) — no dice **qué podés hacer**.
- Confirmar que el usuario autenticado puede realizar una acción puntual sobre un recurso puntual (por ejemplo, borrar *su propio* post) es un chequeo aparte, de autorización, que hay que hacer explícitamente en cada caso.

## Ventajas y desventajas

**Ventajas:**
- Stateless: el server no necesita ir a la base de datos para validar quién es el usuario en cada request.
- Se puede escalar horizontalmente sin compartir estado de sesión entre instancias.

**Desventajas:**
- No se puede revocar antes de que expire: una vez firmado, es válido hasta su `expiresIn`, así el server "se arrepienta" después.
- Si se roba, es utilizable hasta que expire.
- Por eso conviene que tenga **vida corta** (access token) y combinarlo con un mecanismo con estado (refresh token) para poder revocar sesiones de verdad.

## Dónde se implementa acá

- `backend/lib/tokens.ts` — firma (`signAccessToken`) y verificación (`verifyAccessToken`) del access token. Algoritmo fijo `HS256` (nunca se confía en el `alg` que declara el token entrante), `issuer`/`audience` explícitos, payload mínimo (solo `sub` = id de usuario). También genera y hashea el refresh token (que **no** es un JWT, es un valor aleatorio opaco).
- `backend/middlewares/require-auth.ts` — usa `verifyAccessToken` en cada request a una ruta protegida y setea `req.user`.
- `backend/services/auth.service.ts` — emite los tokens en login/register/refresh, y rota/revoca el refresh token guardado en base de datos.
