import type { IPlanCreateReq, IDay, IAttraction, TCurrency } from '@/types/plan';

// ========== 初始计划对象 ==========
export const INIT_PLAN: IPlanCreateReq = {
  name: '',
  content: '',
  start_date: '',
  end_date: '',
  people: 1,
  budget: 0,
  budget_min: 0,
  days: []
};

// ========== 初始日程对象 ==========
export const INIT_DAY: IDay = {
  day: 1,
  attractions: []
};

// ========== 初始景点安排对象 ==========
export const INIT_ATTRACTION: IAttraction = {
  time: 9, // 默认上午9点
  budget: 0,
  currency: 'CNY',
  place_id: 0
};

// ========== 支持的货币列表 ==========
export const CURRENCIES: { value: TCurrency; label: string; symbol: string }[] = [
  { value: 'CNY', label: '人民币', symbol: '¥' },
  { value: 'USD', label: '美元', symbol: '$' },
  { value: 'EUR', label: '欧元', symbol: '€' },
  { value: 'JPY', label: '日元', symbol: '¥' },
  { value: 'GBP', label: '英镑', symbol: '£' },
  { value: 'AUD', label: '澳元', symbol: 'A$' },
  { value: 'CAD', label: '加元', symbol: 'C$' },
  { value: 'CHF', label: '瑞士法郎', symbol: 'CHF' },
  { value: 'HKD', label: '港币', symbol: 'HK$' },
  { value: 'SGD', label: '新加坡元', symbol: 'S$' },
  { value: 'DRI', label: 'DRI', symbol: 'DRI' }
];

// ========== 时间选项 ==========
export const TIME_OPTIONS = [
  { value: 6, label: '06:00' },
  { value: 7, label: '07:00' },
  { value: 8, label: '08:00' },
  { value: 9, label: '09:00' },
  { value: 10, label: '10:00' },
  { value: 11, label: '11:00' },
  { value: 12, label: '12:00' },
  { value: 13, label: '13:00' },
  { value: 14, label: '14:00' },
  { value: 15, label: '15:00' },
  { value: 16, label: '16:00' },
  { value: 17, label: '17:00' },
  { value: 18, label: '18:00' },
  { value: 19, label: '19:00' },
  { value: 20, label: '20:00' },
  { value: 21, label: '21:00' },
  { value: 22, label: '22:00' }
];

// ========== 计划状态选项 ==========
export const PLAN_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', color: '#909399' },
  { value: 'published', label: '已发布', color: '#67c23a' },
  { value: 'completed', label: '已完成', color: '#409eff' },
  { value: 'cancelled', label: '已取消', color: '#f56c6c' }
];

// ========== 预算范围选项 ==========
export const BUDGET_RANGES = [
  { value: [0, 1000], label: '1000以下' },
  { value: [1000, 3000], label: '1000-3000' },
  { value: [3000, 5000], label: '3000-5000' },
  { value: [5000, 10000], label: '5000-10000' },
  { value: [10000, 20000], label: '10000-20000' },
  { value: [20000, 50000], label: '20000-50000' },
  { value: [50000, Infinity], label: '50000以上' }
];

// ========== 人数选项 ==========
export const PEOPLE_OPTIONS = [
  { value: 1, label: '独自一人' },
  { value: 2, label: '情侣/夫妻' },
  { value: 3, label: '小家庭(3人)' },
  { value: 4, label: '家庭(4人)' },
  { value: 5, label: '小团体(5人)' },
  { value: 6, label: '朋友聚会(6人)' },
  { value: 10, label: '团队游(10人)' },
  { value: 20, label: '大团体(20人)' }
]; 