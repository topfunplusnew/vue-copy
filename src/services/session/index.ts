import { http } from '../http';
import type { SessionsResponse, SessionPapersResponse } from './type';

/**
 * 获取Session列表
 * @param params 查询参数（可选）
 * @param params.page 页码（可选）
 * @param params.per_page 每页数量（可选）
 * @returns Promise 返回Session列表
 */
export const getSessions = (params?: {
  page?: number;
  per_page?: number;
}) =>
  http.request<SessionsResponse>({
    method: 'GET',
    url: '/conference/session',
    params,
  });

/**
 * 根据Session ID获取该Session下的所有论文
 * @param sessionId Session ID
 * @param params 查询参数（可选）
 * @param params.page 页码（可选，默认：1）
 * @param params.per_page 每页数量（可选，默认：20）
 * @returns Promise 返回Session下的论文列表
 */
export const getSessionPapers = (sessionId: number, params?: {
  page?: number;
  per_page?: number;
}) =>
  http.request<SessionPapersResponse>({
    method: 'GET',
    url: `/paper/session/${sessionId}/papers`,
    params,
  });

