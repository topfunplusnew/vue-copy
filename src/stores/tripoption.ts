// src/utils/tripoption.ts

// 定义用户旅行选项的接口
export interface TripOptions {
  location: string;
  destination: string;
  preferences: string[];
}

// 内部存储的选项对象
let tripOptions: TripOptions = {
  location: '',
  destination: '',
  preferences: []
};

/**
 * 保存用户选择的 Trip Options
 * @param options 用户选择的信息
 */
export function setTripOptions(options: TripOptions): void {
  tripOptions = options;
}

/**
 * 获取当前保存的 Trip Options
 */
export function getTripOptions(): TripOptions {
  return tripOptions;
}
