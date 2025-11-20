/**
 * 请求
 */
export interface IRequest {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface IResponse<T = unknown> {
  // 返回状态
  code: string | number; // 错误代码
  describe?: string; // 描述
  records?: T; // 数据
}
export interface IPagination<T = unknown> {
  items: T[];
  args: IRequest;
  loading: boolean;
  total: number;
  page: number;
  per_page: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}
export interface ITokenConfig {
  name: string;
  expire: number;
}
export interface IResponseConfig {
  success: (data: unknown) => boolean;
  invalid: (data: unknown) => boolean;
}

export interface IAdaptConfig {
  token?: ITokenConfig | string; // token标签
  response?: IResponseConfig; // api返回信息
}
export const INIT_PAGE_NUM = 1; // 初始页面
export const INIT_PAGE_SIZE = 20; // 分页

export const INIT_PAGINATION = {
  items: [],
  args: {
    page: 1,
    per_page: 20
  },
  loading: false,
  total: 0,
  page: 1,
  per_page: 20,
  pages: 0,
  has_next: false,
  has_prev: false
}

export enum API_STATUS { // api数据状态
  NORMAL, // 正常
  LOADING = 1001, // 加载中
  BOTTOM = 1101, // 加载完所有页面
  ERROR = 2101, // 出错
}
