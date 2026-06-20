'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'
import { getCategoryColor } from '@/lib/categories'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

type MonthlyTotal = { month: string; total: number }
type CategoryTotal = { name: string; value: number }
type ItemRow = {
  id: string
  name: string
  quantity: number
  unit_price: number
  subtotal: number
  category: string
  store_name: string
  date: string
}

function toYM(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatYM(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}年${Number(m)}月`
}

function nextMonthStart(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function ReportPage() {
  const supabase = useMemo(() => createClient(), [])
  const now = new Date()

  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return toYM(d)
  }).reverse(), [])

  const [selectedMonth, setSelectedMonth] = useState(toYM(now))
  const [barData, setBarData] = useState<MonthlyTotal[]>([])
  const [pieData, setPieData] = useState<CategoryTotal[]>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)

    // 6ヶ月分：receipts から取得してクライアント側で月別集計
    const { data: receipts6m } = await supabase
      .from('receipts')
      .select('date, receipt_items(subtotal)')
      .gte('date', months[0] + '-01')
      .order('date', { ascending: true })

    const monthlyMap: Record<string, number> = {}
    months.forEach(m => { monthlyMap[m] = 0 })
    ;(receipts6m ?? []).forEach((r: { date: string; receipt_items: { subtotal: number }[] }) => {
      const ym = r.date.slice(0, 7)
      if (monthlyMap[ym] !== undefined) {
        r.receipt_items.forEach(item => { monthlyMap[ym] += item.subtotal })
      }
    })
    setBarData(months.map(m => ({ month: m.slice(5) + '月', total: monthlyMap[m] })))

    // 選択月：receipts から品目・カテゴリ付きで取得
    const { data: selReceipts } = await supabase
      .from('receipts')
      .select('id, date, store_name, receipt_items(id, name, quantity, unit_price, subtotal, category:categories(name))')
      .gte('date', selectedMonth + '-01')
      .lt('date', nextMonthStart(selectedMonth))
      .order('date', { ascending: false })

    const categoryMap: Record<string, number> = {}
    const rowItems: ItemRow[] = []

    ;(selReceipts ?? []).forEach((r: {
      id: string
      date: string
      store_name: string
      receipt_items: {
        id: string
        name: string
        quantity: number
        unit_price: number
        subtotal: number
        category: { name: string }[] | { name: string } | null
      }[]
    }) => {
      r.receipt_items.forEach(item => {
        const cat = Array.isArray(item.category) ? item.category[0] : item.category
        const catName = cat?.name ?? 'その他'
        categoryMap[catName] = (categoryMap[catName] ?? 0) + item.subtotal

        rowItems.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          category: catName,
          store_name: r.store_name,
          date: r.date,
        })
      })
    })

    setPieData(
      Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    )
    setItems(rowItems)
    setLoading(false)
  }, [selectedMonth, supabase, months])

  useEffect(() => { loadData() }, [loadData])

  const monthTotal = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">レポート</p>
        <p className="text-white/70 text-sm mt-1">月別・カテゴリ別の支出分析</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl min-h-screen pt-5 px-4 space-y-4">
        {/* 月選択 */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {months.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold btn-press transition-colors ${
                selectedMonth === m
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-500'
              }`}
            >
              {m.slice(5)}月
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 animate-pulse">読み込み中...</p>
          </div>
        ) : (
          <>
            {/* 月合計 */}
            <div className="bg-white rounded-2xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">{formatYM(selectedMonth)}の支出</span>
              <span className="text-xl font-bold text-orange-500">¥{monthTotal.toLocaleString()}</span>
            </div>

            {/* 棒グラフ */}
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">月別支出</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => `¥${Number(v).toLocaleString()}`} />
                  <Bar dataKey="total" fill="#fb923c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 円グラフ */}
            {pieData.length > 0 && (
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">カテゴリ別</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip formatter={v => `¥${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 品目テーブル */}
            {items.length > 0 && (
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">品目一覧</p>
                <div className="divide-y divide-gray-50">
                  {items.map(item => (
                    <div key={item.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.store_name} · {item.date}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                          ¥{item.subtotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: getCategoryColor(item.category) + '22',
                            color: getCategoryColor(item.category),
                          }}
                        >
                          {item.category}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-gray-400">
                            ¥{item.unit_price.toLocaleString()} × {item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-10 text-gray-300">
                <p className="text-4xl mb-2">📊</p>
                <p className="text-sm">この月のデータはありません</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
