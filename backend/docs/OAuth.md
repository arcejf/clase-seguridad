# OAuth / OpenID Connect (login con Google)

## ¿Qué es?

Un protocolo que permite que un usuario se autentique en nuestra app usando una cuenta de un proveedor externo de confianza (Google, GitHub, etc.), sin compartir su contraseña con nosotros. La variante que usamos acá (verificar un ID token) es en realidad **OpenID Connect (OIDC)**, una capa de autenticación construida sobre OAuth 2.0.

## ¿Para qué se usa?

Para ofrecer "login social": el usuario no tiene que crear ni recordar una contraseña nueva, y delegamos la verificación de su identidad a un proveedor que ya invirtió en hacerla segura (Google, en este caso).

## ¿Cómo funciona? (flujo usado en este proyecto)

1. El **frontend** usa Google Identity Services para autenticar al usuario directamente contra Google, y obtiene un **ID token** (un JWT firmado por Google).
2. El frontend manda ese ID token al **backend**.
3. El backend **nunca confía en el payload sin verificarlo primero**: usa `google-auth-library` para validar la firma del token contra las claves públicas de Google, que no haya expirado, y que el `audience` coincida con nuestro propio `GOOGLE_CLIENT_ID` (si no se chequeara esto último, cualquier token válido emitido para *otra* app de Google también colaría acá).
4. Si es válido, se busca (o crea, o vincula) el usuario local a partir del `sub` y el `email` del token de Google.
5. El backend emite sus propios tokens (access + refresh) igual que en un login normal — a partir de acá, el flujo es indistinguible de un login por contraseña.

## Dónde se implementa acá

- `backend/services/auth.service.ts` — función `loginWithGoogle`: verificación del ID token con `google-auth-library`, chequeo de `email_verified`, y creación/vinculación del usuario local.
- `backend/domain/user.ts` — `googleLoginSchema`, que solo valida que venga el `credential` (el ID token); la verificación real de contenido pasa por el service.
- `backend/routes/auth.routes.ts` — `POST /api/auth/google`.
