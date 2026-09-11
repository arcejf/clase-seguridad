# Backend, red social mínima (proyecto didáctico de seguridad)

Acá armamos la API de una red social muy simple (usuarios, posts, comentarios, likes)
pensada como material de clase. La funcionalidad es a propósito básica: lo que importa
es que cada parte del código muestre una **buena práctica de seguridad** concreta:
hashing de contraseñas, JWT bien usado, CORS, variables de entorno, validación de
input y autorización. En los comentarios del código explicamos el por qué de cada
decisión, no solo el qué.

## Arranque rápido

Requisito: [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run setup   # crea el .env (con un JWT_SECRET random), la base SQLite y carga los datos de prueba
npm run dev     # levanta la API en http://localhost:3000
```

Para dejar la demo limpia (borra la base y la recrea desde cero):

```bash
npm run db:reset
```

## Usuarios de prueba

El seed (`prisma/seed.ts`) crea tres usuarios con la misma contraseña:

| username  | email                      | contraseña   |
|-----------|----------------------------|--------------|
| martina   | martina.duarte@gmail.com   | `Clase2026!` |
| joaco     | joaquin.pereyra@gmail.com  | `Clase2026!` |
| camisosa  | camila.sosa@gmail.com      | `Clase2026!` |

Tienen posts, comentarios cruzados y likes ya cargados: alcanza para probar todo el
flujo (incluida la protección anti-IDOR) sin tener que registrar usuarios a mano.

> Sí, dejamos la contraseña hardcodeada y documentada acá arriba a propósito: es un
> proyecto de ejemplo para la clase, no un sistema real. Igual pasa por
> `hashPassword()` como cualquier otra: nunca se guarda en texto plano, ni siquiera en
> el seed.

## Por qué SQLite (y por qué el .env se genera solo)

Este proyecto se sube a GitHub y otra persona lo va a correr en su propia PC. Para que
funcione igual en cualquier máquina sin tener que coordinar nada, decidimos lo siguiente:

- Usamos SQLite: un archivo local, sin servidor de base de datos que instalar.
  Las migraciones (`prisma/migrations/`) sí se commitean al repo, así que
  `npm run setup` reconstruye exactamente el mismo esquema en cualquier máquina. El
  archivo `.db` en sí no se commitea (está en `.gitignore`): es generado, no
  versionado, igual que `node_modules`.
- El `.env` real nunca se commitea, porque contiene secretos. Lo que sí va al repo es
  `.env.example`, que documenta qué variables existen. `npm run setup` copia ese
  template a `.env` y genera un `JWT_SECRET` aleatorio nuevo con `crypto.randomBytes`:
  así cada instalación tiene su propio secreto, generado localmente, nunca compartido.

## Variables de entorno

Cada variable está comentada en [`.env.example`](./.env.example). La más importante
para la clase es `JWT_SECRET`: si falta o es demasiado corto, el servidor directamente
no arranca (`config/env.ts` valida todo `process.env` con Zod antes de levantar nada).
Preferimos esto a un default silencioso e inseguro, que es peor que un crash explícito
al arrancar.

`GOOGLE_CLIENT_ID` es la única variable opcional: sin ella, todo el resto de la API
(incluido el login por contraseña) sigue funcionando igual; solo queda desactivado
`POST /api/auth/google` (responde 503).

## Estructura del proyecto

```
backend/
  main.ts          # arranque: valida el .env, levanta el servidor
  app.ts            # Express app: helmet, CORS, rate limiting, rutas, error handler
  config/env.ts      # validación de variables de entorno con Zod
  lib/                # hashing, JWT, cookies, singleton de Prisma, errores tipados
  domain/             # schemas Zod de entrada + mappers de salida (DTOs) por entidad
  services/           # lógica de negocio, no conoce req/res
  controllers/        # traduce HTTP <-> servicios, no tiene lógica de negocio
  routes/              # qué endpoint usa qué middlewares
  middlewares/         # auth, validación, rate limiting, manejo de errores
  prisma/              # schema, migraciones y seed
  scripts/             # setup.ts y db-reset.ts
```

La regla que seguimos con las capas: el controller nunca importa Prisma directamente,
y el service nunca toca `req`/`res`. Así la lógica de negocio (incluida la autorización)
es la misma sin importar desde qué ruta se llegue a ella, y se puede testear sin
levantar un servidor HTTP.

## Endpoints

| Método | Ruta | Auth | Notas |
|---|---|---|---|
| POST | `/api/auth/register` | ninguna | Crea el usuario, devuelve access token + cookie de refresh |
| POST | `/api/auth/login` | ninguna | Rate limit agresivo (5 intentos / 15 min); error siempre genérico |
| POST | `/api/auth/google` | ninguna | Login/registro con un ID token de Google Identity Services |
| POST | `/api/auth/refresh` | cookie | Rota el refresh token (el usado queda revocado) |
| POST | `/api/auth/logout` | cookie | Revoca el refresh token en la base y limpia la cookie |
| GET | `/api/auth/me` | Bearer | Datos del usuario logueado (incluye email) |
| PATCH | `/api/users/me` | Bearer | Editar `displayName` / `bio` |
| GET | `/api/users/:username` | ninguna | Perfil público (sin email, sin hash) |
| GET | `/api/posts` | opcional | Feed paginado por cursor, `limit` máx. 50 |
| POST | `/api/posts` | Bearer | `content`: 1 a 280 caracteres |
| GET | `/api/posts/:id` | opcional | Post con autor, cantidad de comentarios y likes |
| DELETE | `/api/posts/:id` | Bearer | Solo el autor del post (403 si no) |
| GET | `/api/posts/:id/comments` | ninguna | Comentarios de un post |
| POST | `/api/posts/:id/comments` | Bearer | Crear comentario |
| DELETE | `/api/comments/:id` | Bearer | Autor del comentario o del post (403 si no) |
| POST | `/api/posts/:id/like` | Bearer | Dar like (idempotente) |
| DELETE | `/api/posts/:id/like` | Bearer | Quitar like |

"Auth: opcional" significa que la ruta no exige login, pero si mandás un
`Authorization: Bearer` válido, la respuesta usa esa identidad (por ejemplo, para
marcar qué posts ya likeaste).

## Login con Google

`POST /api/auth/google` recibe `{ "credential": "<id token>" }`, el token que devuelve
el botón oficial de Google Identity Services del lado del frontend, y hace lo mismo
que un login por contraseña: emite un access token y una cookie de refresh.

Lo importante para la clase está en `services/auth.service.ts` (`loginWithGoogle`):
usamos `google-auth-library` para verificar la firma del token contra las claves
públicas de Google, que no haya expirado, y que el `audience` coincida con nuestro
propio `GOOGLE_CLIENT_ID`. Si nos salteáramos ese último chequeo, cualquier ID token
válido emitido para otra aplicación de Google también sería aceptado acá. La lección
general es esta: nunca hay que confiar en el payload de un JWT ajeno sin pasar primero
por esa verificación.

Para probarlo hace falta una credencial OAuth 2.0 de tipo "Aplicación web" en
[Google Cloud Console](https://console.cloud.google.com/apis/credentials), con
`http://localhost:5173` como origen de JavaScript autorizado. El mismo Client ID va en
`GOOGLE_CLIENT_ID` (backend) y en `VITE_GOOGLE_CLIENT_ID` (frontend).

## Buenas prácticas de seguridad que muestra este proyecto

1. **Hashing de contraseñas** (`lib/password.ts`): bcrypt, costo 12. El salt va incluido
   en el propio hash; hashear la misma contraseña dos veces da resultados distintos.
2. **Nunca se devuelve el hash** (`domain/user.ts`, `domain/post.ts`): los mappers
   (`toPublicUser`, `toPostDTO`...) arman explícitamente qué sale en cada respuesta.
   Whitelist, no blacklist: si el modelo suma un campo sensible, no se filtra solo.
3. **JWT bien usado** (`lib/tokens.ts`): algoritmo fijo (`HS256`, nunca se confía en el
   `alg` del token entrante), expiración corta, `issuer`/`audience` verificados.
4. **Firmado no es lo mismo que cifrado** (`lib/tokens.ts`): el payload del JWT lleva
   solo el id del usuario. Un JWT firmado garantiza integridad (nadie lo modifica sin
   el secreto), no confidencialidad (cualquiera lo lee en [jwt.io](https://jwt.io),
   base64 no es cifrado). Demo sugerida: pegar un access token ahí, cambiarle el `sub`
   y ver que el server devuelve 401.
5. **Access vs. refresh token**: el access token (15 min) va en memoria del frontend;
   el refresh (7 días) va en una cookie `httpOnly` + `SameSite=strict`
   (`lib/refresh-cookie.ts`). XSS no puede leer la cookie; SameSite mitiga CSRF.
6. **Rotación y revocación** (`services/auth.service.ts`): cada refresh token es de un
   solo uso, al usarlo se revoca y se emite uno nuevo. Es lo único con estado en el
   servidor, por eso el logout funciona de verdad, cosa que un JWT sin estado no puede
   garantizar por sí solo.
7. **Anti user-enumeration y anti timing-attack** (`services/auth.service.ts`): el login
   siempre responde el mismo mensaje genérico, y siempre corre `bcrypt.compare` (contra
   un hash dummy si el usuario no existe), para que el tiempo de respuesta no delate qué
   emails están registrados.
8. **Verificación de un ID token de terceros** (`services/auth.service.ts`,
   `loginWithGoogle`): la firma, el issuer, el audience y la expiración de un JWT ajeno
   (el de Google) se verifican con una librería dedicada antes de confiar en nada de su
   payload.
9. **Validación de entrada con Zod** (`middlewares/validate.ts`, `domain/*.ts`): todo
   body/query/params pasa por un schema antes de llegar al controller. Zod además
   descarta cualquier campo no declarado (mass assignment: un `"role":"admin"` de más en
   el body no hace nada).
10. **Variables de entorno validadas** (`config/env.ts`): si falta o es débil un secreto
    crítico, el proceso no arranca.
11. **Secretos fuera del repo**: `.env` en `.gitignore`, `.env.example` commiteado.
12. **CORS restringido** (`app.ts`): whitelist de un único origen (`CORS_ORIGIN`), nunca
    `"*"`. Con cookies (`credentials: true`) el navegador ni siquiera permite `"*"`.
13. **Helmet** (`app.ts`): cabeceras de seguridad por defecto, quita `X-Powered-By`.
14. **Rate limiting** (`middlewares/rate-limit.ts`): límite agresivo específico en
    login/register/google contra fuerza bruta, más un límite general para el resto de
    la API.
15. **Autorización no es lo mismo que autenticación** (`services/post.service.ts`,
    `services/comment.service.ts`): estar logueado no alcanza, se verifica que quien
    pide borrar un post o comentario sea su dueño. Es la protección contra IDOR
    (Insecure Direct Object Reference): sin este chequeo, cualquiera podría borrar
    contenido ajeno adivinando ids.
16. **SQL injection**: Prisma parametriza todas las queries por default. Hay un ejemplo
    comentado en `post.service.ts` de lo que no hay que hacer (`$queryRawUnsafe` con
    concatenación de strings).
17. **Likes sin condición de carrera** (`services/like.service.ts`,
    `prisma/schema.prisma`): la unicidad de un like la garantiza una clave primaria
    compuesta en la base, no un `if` en JavaScript (que sí tiene condición de carrera
    bajo dos requests simultáneos).
18. **Paginación con tope** (`domain/post.ts`): el feed acepta `limit`, pero nunca por
    encima de 50, para que nadie pida el dataset completo de una.
19. **Errores que no filtran información** (`middlewares/error-handler.ts`): en
    producción, un error inesperado devuelve un mensaje genérico; el detalle (stack
    trace incluido) va solo al log del servidor.
20. **Límite de tamaño de body** (`app.ts`): `express.json({ limit: '10kb' })`.

## Recorrido con curl (para la demo en clase)

Con el server corriendo en `:3000`, así se puede probar cada defensa a mano:

```bash
# Registro
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"nuevo@example.com","username":"nuevo","password":"UnaClaveOk1!","displayName":"Cuenta Nueva"}'

# Login (guarda la cookie de refresh en cookies.txt)
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"martina.duarte@gmail.com","password":"Clase2026!"}'
# copiar el accessToken de la respuesta para los pasos siguientes

# /me sin token → 401
curl -i http://localhost:3000/api/auth/me

# /me con token → 200
curl -s http://localhost:3000/api/auth/me -H "Authorization: Bearer <ACCESS_TOKEN>"

# Refresh: nuevo access token + rota la cookie
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/refresh

# Reusar el refresh token viejo (guardado antes del refresh anterior) → 401
curl -s -b cookies_old.txt -X POST http://localhost:3000/api/auth/refresh

# IDOR: joaco intentando borrar un post de martina → 403
curl -s -X DELETE http://localhost:3000/api/posts/<id de un post de martina> \
  -H "Authorization: Bearer <ACCESS_TOKEN de joaco>"

# Fuerza bruta: 6 logins fallidos seguidos → los últimos dan 429
for i in 1 2 3 4 5 6; do
  curl -s -o /dev/null -w "intento $i: %{http_code}\n" \
    -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"nadie@example.com","password":"wrong"}'
done

# CORS: preflight desde un origen no permitido, el navegador (no curl) lo bloquea
# porque Access-Control-Allow-Origin nunca "hace eco" de un origen no whitelisteado
curl -i -X OPTIONS http://localhost:3000/api/posts \
  -H "Origin: http://evil.com" -H "Access-Control-Request-Method: GET"
```

Para inspeccionar la base y confirmar que `passwordHash` nunca tiene texto plano:

```bash
npx prisma studio
```

## Ideas para seguir sumando (quedan fuera de esta primera versión)

- **2FA** (TOTP) como capa extra sobre el login.
- **Verificación de email** al registrarse por contraseña.
- **CSP más estricta** y `helmet` afinado si el frontend sirve contenido embebido.
- **Tests automatizados** de los flujos de auth (registro, login, refresh, revocación,
  IDOR): quedan services/ ya separados de HTTP, así que son fáciles de testear directo.
- **Roles/admin** para moderar contenido, como ejercicio de autorización más rica.
- **Websockets o polling** para likes/comentarios en tiempo real.

## Nota sobre `npm audit`

Puede que `npm audit` reporte una vulnerabilidad "high" en `deepmerge-ts`, una
dependencia transitiva de la propia herramienta de línea de comandos `prisma` (que se
usa solo en desarrollo, para migraciones y generación de código). No afecta a
`@prisma/client`, que es lo que corre en el servidor, así que no es explotable en el
flujo de esta app.
