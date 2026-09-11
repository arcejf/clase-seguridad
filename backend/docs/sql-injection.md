# SQL Injection

## ¿Qué es?

Una técnica de ataque donde el atacante inserta fragmentos de SQL dentro de un input que el server termina concatenando directamente en una query, alterando su lógica original.

## ¿Para qué se explota?

Para leer, modificar o borrar datos que el atacante no debería poder tocar, o incluso bypassear un login sin conocer la contraseña. Ejemplo clásico: un input `' OR '1'='1` en un campo que se concatena en un `WHERE email = '<input>'` convierte la condición en siempre verdadera.

## ¿Cómo se previene?

Con **queries parametrizadas** (prepared statements): el input del usuario nunca se concatena como texto dentro del SQL, se manda aparte como parámetro, y el motor de base de datos lo trata siempre como dato, nunca como código. La mayoría de los ORMs (como Prisma) hacen esto automáticamente por debajo, sin que el desarrollador tenga que pensarlo.

## Dónde se ve en el proyecto

- `backend/services/post.service.ts` tiene, comentado, un ejemplo explícito de lo que **nunca** hay que hacer: una función `searchPostsUNSAFE` que usa `prisma.$queryRawUnsafe` concatenando el input del usuario directamente en el string SQL.
- En el mismo archivo, las queries reales (`prisma.post.findMany`, `prisma.post.findUnique`, etc.) usan la API normal de Prisma, que parametriza automáticamente cualquier valor que reciba — no hace falta escapar nada a mano.
