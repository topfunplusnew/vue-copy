import dayjs from 'dayjs';

export const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};


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
