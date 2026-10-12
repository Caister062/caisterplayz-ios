/**
 * Formats numeric values to standard gaming/social metric short strings:
 * e.g.,
 * 950 -> "950"
 * 1,500 -> "1.5K"
 * 2,000,000 -> "2M"
 * 4,500,000,000 -> "4.5B"
 * 10,000,000,000,000 -> "10T"
 */
export function formatCount(num) {
  if (num === null || num === undefined) return '0';
  const val = Number(num);
  if (isNaN(val) || val === 0) return '0';

  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (absVal >= 1e12) {
    const formatted = (absVal / 1e12).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}T`;
  }
  if (absVal >= 1e9) {
    const formatted = (absVal / 1e9).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}B`;
  }
  if (absVal >= 1e6) {
    const formatted = (absVal / 1e6).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}M`;
  }
  if (absVal >= 1e3) {
    const formatted = (absVal / 1e3).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}K`;
  }

  return `${sign}${absVal}`;
}
