import type { ICommon } from './base';
import type { IPagination, IRequest } from './service';
import type { IUser } from './user';

// ========== 基础地点接口 ==========
export interface IPlace extends ICommon {
  name: string;
  content: string;
  lon: number;
  lat: number;
}

// ========== 景点安排接口 ==========
export interface IAttraction {
  time: number;          // 时间
  budget: number;        // 预算
  currency: string;      // 货币类型 (USD, CNY, DRI等)
  place_id: number;      // 地点ID
  place?: IPlace;        // 可选的地点详情（前端扩展）
}

// ========== 每日安排接口 ==========
export interface IDay {
  day: number;           // 第几天
  attractions: IAttraction[];  // 景点安排列表
}

// ========== 计划创建请求接口 ==========
export interface IPlanCreateReq {
  name: string;          // 计划名称
  content: string;       // 计划描述
  start_date: string;    // 开始日期 (YYYY-MM-DD)
  end_date: string;      // 结束日期 (YYYY-MM-DD)
  people: number;        // 人数
  budget: number;        // 总预算
  budget_min: number;    // 最小预算
  days: IDay[];          // 每日安排
}

// ========== 计划修改请求接口 ==========
export interface IPlanUpdateReq extends IPlanCreateReq {
  id: number;            // 计划ID（修改时必需）
}

// ========== 计划响应接口 ==========
export interface IPlan extends ICommon {
  user?: IUser;          // 用户信息（可选）
  name: string;          // 计划名称
  content: string;       // 计划描述
  start_date: string;    // 开始日期
  end_date: string;      // 结束日期
  people: number;        // 人数
  budget: number;        // 总预算
  budget_min: number;    // 最小预算
  days: IDay[];          // 每日安排
}

// ========== 地点创建请求接口 ==========
export interface IPlaceCreateReq {
  name: string;          // 地点名称
  content: string;       // 地点描述
  lon: number;           // 经度
  lat: number;           // 纬度
}

// ========== 计划分页响应接口 ==========
export interface IPlanPage extends IPagination {
  items: IPlan[];
}

// ========== 计划搜索请求接口 ==========
export interface IPlanSearchReq extends IRequest {
  name?: string;         // 按名称搜索
  user_id?: number;      // 按用户ID搜索
  start_date?: string;   // 开始日期范围
  end_date?: string;     // 结束日期范围
  budget_min?: number;   // 最小预算范围
  budget_max?: number;   // 最大预算范围
}

// ========== 前端扩展接口（用于组件状态管理） ==========
export interface IPlanExtended extends IPlan {
  // 前端计算字段
  duration_days?: number;        // 计划持续天数
  total_attractions?: number;    // 总景点数
  average_daily_budget?: number; // 日均预算
  is_editable?: boolean;         // 是否可编辑
  status?: 'draft' | 'published' | 'completed';  // 计划状态
}

// ========== 货币类型 ==========
export type TCurrency = 'USD' | 'CNY' | 'EUR' | 'JPY' | 'GBP' | 'AUD' | 'CAD' | 'CHF' | 'HKD' | 'SGD' | 'DRI';

// ========== 计划状态类型 ==========
export type TPlanStatus = 'draft' | 'published' | 'completed' | 'cancelled';

// ========== 错误类型 ==========
export interface IPlanError {
  code: 'PLAN_NOT_FOUND' | 'INVALID_DATE_RANGE' | 'INVALID_BUDGET' | 'PLACE_NOT_FOUND' | 'PERMISSION_DENIED';
  message: string;
  details?: any;
}

export { INIT_PLAN, INIT_DAY, INIT_ATTRACTION } from '@/constants/plan';


