import { apiRequest } from '@/lib/api-client';
import type { CommentDTO, ListPostsResponse, PostDTO } from '@/types/api';
import type { CreateCommentInput, CreatePostInput } from '@/schemas/post.schemas';

export function listPosts(cursor?: string): Promise<ListPostsResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequest<ListPostsResponse>(`/api/posts${query}`);
}

export async function getPost(id: string): Promise<PostDTO> {
  const { post } = await apiRequest<{ post: PostDTO }>(`/api/posts/${id}`);
  return post;
}

export async function createPost(input: CreatePostInput): Promise<PostDTO> {
  const { post } = await apiRequest<{ post: PostDTO }>('/api/posts', { method: 'POST', body: input });
  return post;
}

export function deletePost(id: string): Promise<void> {
  return apiRequest<void>(`/api/posts/${id}`, { method: 'DELETE' });
}

export async function listComments(postId: string): Promise<CommentDTO[]> {
  const { comments } = await apiRequest<{ comments: CommentDTO[] }>(`/api/posts/${postId}/comments`);
  return comments;
}

export async function createComment(postId: string, input: CreateCommentInput): Promise<CommentDTO> {
  const { comment } = await apiRequest<{ comment: CommentDTO }>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: input,
  });
  return comment;
}

export function deleteComment(commentId: string): Promise<void> {
  return apiRequest<void>(`/api/comments/${commentId}`, { method: 'DELETE' });
}

export function likePost(id: string): Promise<{ likeCount: number }> {
  return apiRequest<{ likeCount: number }>(`/api/posts/${id}/like`, { method: 'POST' });
}

export function unlikePost(id: string): Promise<{ likeCount: number }> {
  return apiRequest<{ likeCount: number }>(`/api/posts/${id}/like`, { method: 'DELETE' });
}
