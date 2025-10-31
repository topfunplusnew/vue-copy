/**
 * 添加到喜欢的请求参数
 */
export interface IAddFavoriteRequest {
  conference_id: number;
}

/**
 * 添加到喜欢的响应数据
 */
export interface IAddFavoriteResponse {
  status: string;
  user_id: number;
  email: string;
  conference_id: number;
}

