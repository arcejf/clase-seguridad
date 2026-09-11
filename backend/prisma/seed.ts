// Estos son datos de prueba para la demo (usamos una contraseña predecible a
// propósito, documentada en el README). Igual la pasamos por hashPassword():
// ni en un seed de ejemplo se guarda una contraseña en texto plano.
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Clase2026!';

async function main() {
  console.log('Sembrando datos de prueba...');

  const passwordHash = await hashPassword(SEED_PASSWORD);

  const [martina, joaquin, camila] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'martina.duarte@gmail.com' },
      update: {},
      create: {
        email: 'martina.duarte@gmail.com',
        username: 'martina',
        passwordHash,
        displayName: 'Martina Duarte',
        bio: 'Estudiando seguridad informática en la UBA. Fan de romper cosas para entenderlas.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'joaquin.pereyra@gmail.com' },
      update: {},
      create: {
        email: 'joaquin.pereyra@gmail.com',
        username: 'joaco',
        passwordHash,
        displayName: 'Joaquín Pereyra',
        bio: 'Backend developer. Mate, código y bugs en producción.',
      },
    }),
    prisma.user.upsert({
      where: { email: 'camila.sosa@gmail.com' },
      update: {},
      create: {
        email: 'camila.sosa@gmail.com',
        username: 'camisosa',
        passwordHash,
        displayName: 'Camila Sosa',
        bio: 'Ayudante en la cátedra de seguridad. Siempre con una excusa para hablar de contraseñas.',
      },
    }),
  ]);

  // Si ya hay datos de una corrida anterior, no volvemos a crear posts.
  const existingPosts = await prisma.post.count();
  if (existingPosts > 0) {
    console.log('Ya hay posts en la base, se omite crear contenido de ejemplo.');
    await prisma.$disconnect();
    return;
  }

  const post1 = await prisma.post.create({
    data: {
      authorId: martina.id,
      content: 'Arrancamos la clase de seguridad, hoy vemos JWT, bcrypt y CORS en vivo.',
    },
  });
  const post2 = await prisma.post.create({
    data: {
      authorId: joaquin.id,
      content: '¿Por qué un JWT firmado no es lo mismo que uno cifrado? Me lo preguntaron tres veces esta semana.',
    },
  });
  const post3 = await prisma.post.create({
    data: {
      authorId: camila.id,
      content: 'Recordatorio de siempre: nunca guarden contraseñas en texto plano. Nunca. En serio.',
    },
  });
  const post4 = await prisma.post.create({
    data: {
      authorId: martina.id,
      content: 'Dato random: bcrypt.compare corre en tiempo constante, por algo se usa en vez de comparar strings con ===.',
    },
  });

  await Promise.all([
    prisma.comment.create({
      data: { postId: post1.id, authorId: joaquin.id, content: 'Justo lo que necesitaba repasar antes del parcial.' },
    }),
    prisma.comment.create({
      data: { postId: post1.id, authorId: camila.id, content: 'Traigan preguntas sobre CORS, por favor.' },
    }),
    prisma.comment.create({
      data: { postId: post2.id, authorId: camila.id, content: 'Firmado es integridad, cifrado es confidencialidad. Son cosas distintas.' },
    }),
    prisma.comment.create({
      data: { postId: post3.id, authorId: martina.id, content: 'Ni siquiera en un seed de ejemplo.' },
    }),
  ]);

  await Promise.all([
    prisma.like.create({ data: { userId: joaquin.id, postId: post1.id } }),
    prisma.like.create({ data: { userId: camila.id, postId: post1.id } }),
    prisma.like.create({ data: { userId: martina.id, postId: post2.id } }),
    prisma.like.create({ data: { userId: joaquin.id, postId: post3.id } }),
    prisma.like.create({ data: { userId: martina.id, postId: post3.id } }),
    prisma.like.create({ data: { userId: camila.id, postId: post4.id } }),
  ]);

  console.log('Seed completo: 3 usuarios (martina, joaco, camisosa), 4 posts, comentarios y likes.');
  console.log(`Contraseña de los tres: ${SEED_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('Error corriendo el seed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
