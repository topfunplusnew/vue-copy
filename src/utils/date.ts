import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * 获取用户当前时区
 * @returns 用户当前时区字符串（如 'Asia/Shanghai'、'America/New_York'）
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to get user timezone, falling back to UTC:', error);
    return 'UTC';
  }
}

export function formatRange(start?: string, end?: string): string {
  const s = dayjs(start);
  const e = end ? dayjs(end) : null;

  // 只传入一个时间
  if (!e) return s.format('MMM D, YYYY');

  const ySame = s.year() === e.year();
  const mSame = ySame && s.month() === e.month();

  if (mSame) return `${s.format('MMM D')}–${e.format('D')}, ${s.format('YYYY')}`;
  if (ySame) return `${s.format('MMM D')} – ${e.format('MMM D')}, ${s.format('YYYY')}`;
  return `${s.format('MMM D, YYYY')} – ${e.format('MMM D, YYYY')}`;
}

/**
 * 将 UTC 时间转换为指定时区的本地时间
 * @param utcTime - UTC 时间（ISO 字符串、Date 对象或 dayjs 支持的格式）
 * @param targetZone - 目标时区（如 'Asia/Shanghai'、'America/New_York'），如果不提供则使用用户当前时区
 * @param format - 可选，输出格式（默认 'YYYY-MM-DD HH:mm:ss'）
 * @returns 指定时区格式化后的时间字符串
 */
export function convertUTCToTimezone(utcTime: string | Date, targetZone?: string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const timezone = targetZone || getUserTimezone();
  return dayjs.utc(utcTime).tz(timezone).format(format);
}
