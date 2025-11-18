import { http } from '../http';
import type {
  CreatePaperCommentData,
  UpdatePaperCommentData,
  GetPaperCommentsResponse,
  PaperCommentResponse,
} from './type';

/**
 * 获取论文评论列表
 * @param paperId 论文ID
 * @returns Promise 返回评论列表
 */
export const getPaperComments = (paperId: number | string) =>
  http.get<GetPaperCommentsResponse>(`/paper/${paperId}/comments`);

/**
 * 创建论文评论
 * @param paperId 论文ID
 * @param data 评论数据
 * @param data.content 评论内容
 * @returns Promise 返回创建的评论
 */
export const createPaperComment = (paperId: number | string, data: CreatePaperCommentData) =>
  http.post<PaperCommentResponse>(`/paper/${paperId}/comments`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

/**
 * 更新论文评论
 * @param paperId 论文ID
 * @param data 更新数据
 * @param data.id 评论ID
 * @param data.is_private 是否私有（可选）
 * @returns Promise 返回更新后的评论
 */
export const updatePaperComment = (paperId: number | string, data: UpdatePaperCommentData) =>
  http.put<PaperCommentResponse>(`/paper/${paperId}/comments`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
