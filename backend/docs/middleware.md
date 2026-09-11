# Middleware

Es una funcion que tiene acceso al objeto de solicitud (req), al objeto de respuesta (res) y a la siguiente función de middleware en el ciclo de solicitud/respuesta de la aplicación. La siguiente función de middleware se denota comúnmente con una variable llamada next.

Cada middleware se puede ir encadenando con otro, de manera que cada uno puede realizar operaciones sobre la solicitud y la respuesta, y luego pasar el control al siguiente middleware en la cadena.

Se ejecutan en el orden en que se definen, por lo que es importante tener en cuenta en qué orden se registran los middlewares en la aplicación.


## Middlewares de express

En express, ya vienen algunos middlewares por defecto como:
- express.json(): Analiza las solicitudes entrantes con cargas JSON y se basa en body-parser.
- express.urlencoded(): Analiza las solicitudes entrantes con cargas codificadas en URL y se basa en body-parser.
- express.static(): Sirve archivos estáticos y es un reemplazo de el middleware de archivos estáticos de connect.

Se cargan en el archivo principal de la aplicación (app.js) con el método use() de express, que se encarga de registrar el middleware en todas las rutas de la aplicación.

Tambien se pueden usar estos middlewares en rutas especificas, para eso se debe pasar como segundo parametro del metodo get(), post(), put() o delete() el middleware que se desea usar.

## Middlewares personalizados

Estos son middlewares que se crean para realizar tareas especificas, como por ejemplo, validar un token de autenticación, registrar información de la solicitud, entre otros.

## Dónde se implementan acá

- `backend/middlewares/require-auth.ts` — autenticación: valida el JWT del request (ver `jwt.md`).
- `backend/middlewares/validate.ts` — validación de body/query/params con Zod (ver `validaciones.md`).
- `backend/middlewares/rate-limit.ts` — límite de requests por IP (ver `rate-limit.md`).
- `backend/middlewares/error-handler.ts` — manejo centralizado de errores, siempre el último en registrarse.