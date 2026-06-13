export const CATEGORIES = [
  '食費',
  '外食',
  '交通',
  '日用品',
  '娯楽',
  '医療・薬',
  '衣類',
  '通信',
  'サブスク',
  'その他',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_STYLE: Record<string, { bg: string; text: string; emoji: string }> = {
  '食費':   { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '🛒' },
  '外食':   { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🍜' },
  '交通':   { bg: 'bg-blue-100',   text: 'text-blue-700',   emoji: '🚃' },
  '日用品': { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '🧴' },
  '娯楽':   { bg: 'bg-purple-100', text: 'text-purple-700', emoji: '🎮' },
  '医療・薬': { bg: 'bg-red-100',  text: 'text-red-700',    emoji: '💊' },
  '衣類':   { bg: 'bg-pink-100',   text: 'text-pink-700',   emoji: '👕' },
  '通信':   { bg: 'bg-cyan-100',   text: 'text-cyan-700',   emoji: '📱' },
  'サブスク': { bg: 'bg-indigo-100', text: 'text-indigo-700', emoji: '📺' },
  'その他': { bg: 'bg-gray-100',   text: 'text-gray-700',   emoji: '📦' },
}
