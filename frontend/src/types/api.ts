// Tipos espejo de los DTOs del backend (ver backend/domain/*.ts): el backend
// es la fuente de verdad, esto solo documenta el contrato del lado cliente.

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  createdAt: string;
}

// Solo el propio usuario ve su email; el perfil público de otro nunca lo trae
// (ver toPublicUser() vs. toAuthenticatedUser() en backend/domain/user.ts).
export interface AuthenticatedUser extends PublicUser {
  email: string;
}

export interface PostDTO {
  id: string;
  content: string;
  createdAt: string;
  author: PublicUser;
  commentCount: number;
  likeCount: number;
  likedByCurrentUser: boolean;
}

export interface CommentDTO {
  id: string;
  content: string;
  postId: string;
  createdAt: string;
  author: PublicUser;
}

export interface AuthResponse {
  user: AuthenticatedUser;
}

export interface ListPostsResponse {
  posts: PostDTO[];
  nextCursor: string | null;
}
