export interface IApiUrls {
  // apiurl枚举
  [porpName: string]: string;
}
/**
 * 请求
 */
export interface IRequest {
  pageNum?: number;
  pageSize?: number;
}

export interface IResponse<T = unknown> {
  // 返回状态
  code: string | number; // 错误代码
  describe?: string; // 描述
  records?: T; // 数据
}
export interface IPagination {
  // 分页
  endRow: number;
  hasNextPage: false;
  hasPreviousPage: false;
  isFirstPage: true;
  isLastPage: true;
  navigateFirstPage: number;
  navigateLastPage: number;
  navigatePages: number;
  navigatepageNums: number[];
  nextPage: number;
  pageNum: number;
  pageSize: number;
  pages: number;
  prePage: number;
  size: number;
  startRow: number;
  total: number;
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
export const INIT_PAGE_SIZE = 10; // 分页

export enum API_STATUS { // api数据状态
  NORMAL, // 正常
  LOADING = 1001, // 加载中
  BOTTOM = 1101, // 加载完所有页面
  ERROR = 2101, // 出错
}
