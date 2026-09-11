import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/http-errors';
import { toPostDTO, type CreatePostInput, type ListPostsQuery, type PostDTO } from '../domain/post';

const postInclude = {
  author: true,
  _count: { select: { comments: true, likes: true } },
} as const;

export async function listPosts(query: ListPostsQuery, currentUserId?: string): Promise<{ posts: PostDTO[]; nextCursor: string | null }> {
  const posts = await prisma.post.findMany({
    take: query.limit + 1, // uno de más, para saber si hay siguiente página
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      ...postInclude,
      likes: currentUserId ? { where: { userId: currentUserId }, select: { userId: true } } : false,
    },
  });

  const hasMore = posts.length > query.limit;
  const page = hasMore ? posts.slice(0, query.limit) : posts;

  return {
    posts: page.map((post) => toPostDTO(post, currentUserId)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getPost(postId: string, currentUserId?: string): Promise<PostDTO> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      ...postInclude,
      likes: currentUserId ? { where: { userId: currentUserId }, select: { userId: true } } : false,
    },
  });
  if (!post) throw new NotFoundError('Post no encontrado');
  return toPostDTO(post, currentUserId);
}

export async function createPost(authorId: string, input: CreatePostInput): Promise<PostDTO> {
  const post = await prisma.post.create({
    data: { content: input.content, authorId },
    include: { ...postInclude, likes: false },
  });
  return toPostDTO(post, authorId);
}

export async function deletePost(postId: string, requesterId: string): Promise<void> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post no encontrado');

  // Autorización ≠ autenticación: requireAuth ya confirmó QUIÉN hace el request,
  // esto confirma que ESE usuario puede actuar sobre ESTE recurso. Sin este
  // chequeo, cualquiera podría borrar posts ajenos adivinando ids (IDOR).
  if (post.authorId !== requesterId) {
    throw new ForbiddenError('No podés borrar un post que no es tuyo');
  }

  await prisma.post.delete({ where: { id: postId } });
}

// Ejemplo de lo que NUNCA hay que hacer: SQL por concatenación de strings.
// Prisma ya parametriza queries (`content: { contains: q }`) sin necesitar esto.
//
// async function searchPostsUNSAFE(q: string) {
//   // NUNCA HACER ESTO: `q` viene del usuario tal cual, sin escapar.
//   // Un input como `' OR '1'='1` rompe la query por completo.
//   return prisma.$queryRawUnsafe(`SELECT * FROM posts WHERE content LIKE '%${q}%'`);
// }
