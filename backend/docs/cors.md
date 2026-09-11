# CORS (Cross-Origin Resource Sharing)

## ¿Qué es?

Un mecanismo del **navegador** que restringe qué orígenes (dominios) pueden leer la respuesta de un request hecho desde JavaScript hacia otro origen distinto.

## ¿Para qué se usa?

Para evitar que cualquier sitio web pueda hacer requests a nuestra API desde el navegador de un usuario logueado y leer la respuesta (por ejemplo, robar sus datos usando su propia sesión, sin que el usuario se entere).

## ¿Cómo funciona?

1. El navegador manda el header `Origin` en el request indicando desde qué dominio se hace.
2. El server responde con headers `Access-Control-Allow-*` diciendo qué orígenes tiene permitidos.
3. Si el origin del request no está permitido, el navegador **bloquea que el JavaScript lea la respuesta** (el request en sí puede llegar a ejecutarse igual, salvo que sea un request "no simple" que dispare un preflight `OPTIONS` antes).
4. CORS no protege al server, protege al usuario: la defensa ocurre del lado del navegador, no del backend.

## Dónde se implementa acá

- `backend/app.ts` — configuración de `cors()`:
  - Whitelist de un único origen (`env.CORS_ORIGIN`), no `*`.
  - `credentials: true` para permitir que el navegador mande la cookie del refresh token en los requests (con `*` como origin esto no es legal, el navegador lo bloquea).
  - `exposedHeaders` para que el frontend pueda leer desde JS los headers `RateLimit-*` (por default el navegador no expone headers custom a `fetch`, aunque lleguen en la respuesta).
