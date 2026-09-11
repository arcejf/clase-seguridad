# Validación de datos de entrada

## ¿Qué es?

El proceso de verificar que todo dato que llega desde el cliente (body, query params, params de ruta) tiene la forma, el tipo y las restricciones esperadas antes de que el resto del código lo use.

## ¿Para qué se usa?

- Evitar bugs por datos con forma inesperada (un número donde se esperaba un string, un campo faltante, etc.).
- Prevenir **mass assignment**: que el cliente mande campos de más (por ejemplo `role: "admin"` en un registro) y que esos campos terminen colándose en la base de datos.
- Dar errores claros y tempranos al cliente, en vez de que el dato inválido explote en un lugar random del código.

## ¿Cómo funciona acá?

Con [Zod](https://zod.dev/): se define un *schema* que describe la forma esperada del dato, y `safeParse` lo valida contra ese schema. Si no matchea, se rechaza el request con un error 400 antes de llegar al controller. Si matchea, Zod además:

- Aplica transformaciones declaradas (`.trim()`, `.toLowerCase()`, coerciones de tipo, etc.).
- Hace ***strip*** de cualquier campo no declarado en el schema — el dato validado nunca tiene más campos que los que el schema permite, aunque el cliente haya mandado más.

## Dónde se implementa acá

- `backend/middlewares/validate.ts` — middleware genérico `validate(schema, target)` que se cuelga en cualquier ruta y valida `body`, `query` o `params` contra un schema de Zod.
- `backend/domain/user.ts` — schemas de ejemplo (`registerSchema`, `loginSchema`, `updateProfileSchema`, `googleLoginSchema`), con el comentario explícito sobre cómo esto previene mass assignment.
- `backend/routes/*.routes.ts` — cada ruta que recibe datos del cliente pasa por `validate(...)` antes de llegar al controller correspondiente.
