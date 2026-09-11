# Clase de Seguridad: Red social simple

Acá armamos una red social simple (usuarios, posts, comentarios, likes) para mostrar buenas prácticas de seguridad en un backend y un frontend reales, no para ser un producto terminado. Tiene dos partes:

- [`backend/`](./backend) — API en Node.js + Express + TypeScript + Prisma (SQLite).
- [`frontend/`](./frontend) — Cliente en React + Vite + TypeScript.

Cada carpeta tiene su propio README con más detalle. Este de acá es solo para levantar el proyecto rápido.

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior.

## Levantar el proyecto

Se necesitan dos terminales: una para el backend, otra para el frontend.

**Terminal 1 — backend**

```bash
cd backend
npm install
npm run setup   # crea el .env con un JWT_SECRET random, la base SQLite y los datos de prueba
npm run dev     # API en http://localhost:3000
```

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Abrí `http://localhost:5173`. No hace falta crear ningún `.env` a mano en ninguna de las dos partes para que ande localmente.

## Usuarios de prueba

El seed del backend ya carga usuarios con posts, comentarios y likes cruzados:

| email                      | contraseña   |
|----------------------------|--------------|
| martina.duarte@gmail.com   | `Clase2026!` |
| joaquin.pereyra@gmail.com  | `Clase2026!` |
| camila.sosa@gmail.com      | `Clase2026!` |

## Ver la base de datos (Prisma Studio)

Con el backend ya instalado (`npm install` corrido al menos una vez), desde `backend/`:

```bash
npm run prisma:studio
```

Abre una interfaz web (`http://localhost:5555`) para explorar y editar las tablas de SQLite directamente. Sirve para confirmar cosas como que `passwordHash` nunca tiene una contraseña en texto plano.

## Temas de seguridad y dónde están

En `backend/docs/` dejamos una explicación corta de cada tema, en formato "qué es / para qué sirve / cómo funciona / dónde se implementa en este repo":

- [`middleware.md`](./backend/docs/middleware.md) — qué es un middleware en Express.
- [`validaciones.md`](./backend/docs/validaciones.md) — validación de entrada con Zod, mass assignment.
- [`jwt.md`](./backend/docs/jwt.md) — JWT, autenticación vs. autorización, access vs. refresh token.
- [`cors.md`](./backend/docs/cors.md) — CORS y por qué protege al usuario, no al servidor.
- [`rate-limit.md`](./backend/docs/rate-limit.md) — rate limiting, fuerza bruta, `trust proxy`.
- [`sql-injection.md`](./backend/docs/sql-injection.md) — SQL injection y por qué Prisma protege de esto por default.
- [`OAuth.md`](./backend/docs/OAuth.md) — OAuth/OIDC, el login con Google de este proyecto.

Los READMEs de [`backend/`](./backend/README.md) y [`frontend/`](./frontend/README.md) tienen el resto: la lista completa de buenas prácticas aplicadas, la estructura de carpetas, los endpoints, y un recorrido con `curl` para probar cada defensa (login, JWT manipulado, IDOR, fuerza bruta, CORS, etc.).
