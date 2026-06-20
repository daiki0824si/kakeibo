export const CATEGORY_COLORS: Record<string, string> = {
  '食費':     '#4ade80',
  '外食':     '#fb923c',
  '交通':     '#60a5fa',
  '日用品':   '#facc15',
  '娯楽':     '#c084fc',
  '医療・薬': '#f87171',
  '衣類':     '#f472b6',
  '通信':     '#22d3ee',
  'サブスク': '#818cf8',
  'その他':   '#94a3b8',
}

export function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[name] ?? '#94a3b8'
}
