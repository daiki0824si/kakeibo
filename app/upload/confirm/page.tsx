'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ExtractedItem, ExtractedReceipt, Category } from '@/lib/types'

export default function ConfirmPage() {
  const router = useRouter()
  const supabase = createClient()

  const [receipt, setReceipt] = useState<ExtractedReceipt | null>(null)
  const [items, setItems] = useState<ExtractedItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('extractedReceipt')
    if (!raw) { router.replace('/upload'); return }
    const data: ExtractedReceipt = JSON.parse(raw)
    setReceipt(data)
    setItems(data.items)
  }, [router])

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [supabase])

  const updateItem = (index: number, field: keyof ExtractedItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[index], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        item.subtotal = (field === 'quantity' ? Number(value) : item.quantity)
          * (field === 'unit_price' ? Number(value) : item.unit_price)
      }
      next[index] = item
      return next
    })
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!receipt || items.length === 0) return
    setSaving(true)
    setError(null)

    try {
      const { data: receiptRow, error: receiptError } = await supabase
        .from('receipts')
        .insert({ date: receipt.date, store_name: receipt.store_name })
        .select('id')
        .single()

      if (receiptError || !receiptRow) throw new Error('保存に失敗しました')

      const categoryMap = Object.fromEntries(categories.map(c => [c.name, c.id]))

      const rows = items.map(item => ({
        receipt_id: receiptRow.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        category_id: categoryMap[item.category] ?? null,
      }))

      const { error: itemsError } = await supabase.from('receipt_items').insert(rows)
      if (itemsError) throw new Error('品目の保存に失敗しました')

      sessionStorage.removeItem('extractedReceipt')
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
      setSaving(false)
    }
  }

  if (!receipt) return null

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  return (
    <div className="min-h-screen bg-[#f7f5f2] pb-8">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">内容を確認</p>
        <p className="text-white/70 text-sm mt-1">品目を確認・修正してから保存</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl pt-5 px-4 space-y-3">
        {/* ヘッダー情報 */}
        <div className="bg-white rounded-2xl divide-y divide-gray-50">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-400">日付</span>
            <span className="text-sm font-semibold text-gray-800">{receipt.date}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-400">店名</span>
            <span className="text-sm font-semibold text-gray-800">{receipt.store_name}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-400">合計</span>
            <span className="text-sm font-bold text-orange-500">¥{total.toLocaleString()}</span>
          </div>
        </div>

        {/* 品目一覧 */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">品目一覧</p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  className="flex-1 text-sm font-semibold text-gray-800 bg-transparent border-b border-gray-200 pb-1 outline-none"
                  value={item.name}
                  onChange={e => updateItem(i, 'name', e.target.value)}
                />
                <button
                  onClick={() => removeItem(i)}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div className="flex flex-col gap-1">
                  <span>数量</span>
                  <input
                    type="number"
                    className="bg-gray-50 rounded-lg px-2 py-1.5 text-sm text-gray-800 outline-none w-full"
                    value={item.quantity}
                    min={1}
                    onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span>単価(円)</span>
                  <input
                    type="number"
                    className="bg-gray-50 rounded-lg px-2 py-1.5 text-sm text-gray-800 outline-none w-full"
                    value={item.unit_price}
                    min={0}
                    onChange={e => updateItem(i, 'unit_price', Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span>小計(円)</span>
                  <div className="bg-orange-50 rounded-lg px-2 py-1.5 text-sm font-semibold text-orange-500">
                    ¥{item.subtotal.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">カテゴリ</span>
                <select
                  className="flex-1 bg-gray-50 rounded-lg px-2 py-1.5 text-sm text-gray-800 outline-none"
                  value={item.category}
                  onChange={e => updateItem(i, 'category', e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-2xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push('/upload')}
            className="flex-1 bg-white text-gray-500 font-semibold py-4 rounded-2xl text-sm btn-press"
          >
            やり直す
          </button>
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="flex-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-50 btn-press"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
