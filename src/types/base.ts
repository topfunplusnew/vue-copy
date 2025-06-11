export interface ICommon {
  id?: number; // prime 索引
  updated_at?: string; // 修改时间
  created_at?: string; // 创建时间
}

// 景点目的地类型
export interface Destination {
  name: string;
  content: string;
  messageIndex: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// 景点类型
export interface Attraction {
  time: number;
  timeFormatted: string;
  budget: number;
  currency: string;
  place_id: number;
  placeName: string;
}

// 日期行程类型
export interface DayPlan {
  day: number;
  attractions: Attraction[];
}

// 旅行计划类型
export interface TravelPlan {
  title: string;
  content: string;
  duration: {
    startDate: string;
    endDate: string;
  };
  people: number;
  budget: number;
  days: DayPlan[];
}

// 保存的计划数据类型
export interface SavedPlanData {
  name: string;
  content: string;
  start_date: string;
  end_date: string;
  people: number;
  budget: number;
  days: Array<{
    day: number;
    attractions: Array<{
      time: number;
      budget: number;
      currency: string;
      place_id: number;
      placeName: string;
    }>;
  }>;
}
