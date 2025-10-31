import { http } from '../http';
import type { IAddFavoriteRequest, IAddFavoriteResponse } from './type';

/**
 * 添加到喜欢
 * @param data 请求参数，包含 conference_id
 * @returns Promise<IAddFavoriteResponse>
 */
export const addFavorite = (data: IAddFavoriteRequest) => {
  if (!data.conference_id) {
    throw new Error('You must set up conference id to upload');
  }
  return http.request<IAddFavoriteResponse>({
    method: 'POST',
    url: '/user/add-favorite',
    data,
  });
};
