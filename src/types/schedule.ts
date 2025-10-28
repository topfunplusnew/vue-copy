export interface IScheduleEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  location?: string;
  description?: string;
  type: 'conference' | 'meeting' | 'deadline' | 'personal' | 'session' | 'custom';
  customColor?: string; // 自定义颜色 (hex格式)
  isUserSession?: boolean; // 是否为用户session
}
