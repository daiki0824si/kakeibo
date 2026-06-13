'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/categories'

type ExtractResult = {
  date: string
  store_name: string
  amount: number
  category: string
}

function ConfirmContent() {
  const searchParams = useSearchParams()
  const imageUrl = searchParams.get('imageUrl') ?? ''
  const mimeType = searchParams.get('mimeType') ?? ''
  const router = useRouter()
  const supabase = createClient()

  const [result, setResult] = useState<ExtractResult | null>(null)
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const extract = async () => {
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, mimeType }),
        })
        const json = await res.json()
        if (json.result?.error) throw new Error(json.result.error)
        if (!res.ok || !json.result) throw new Error(json.error ?? '抽出に失敗しました')
        setResult(json.result)
        setCategory(json.result.category)
      } catch (e) {
        setError(e instanceof Error ? e.message : '抽出に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    extract()
  }, [imageUrl, mimeType])

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('receipts').insert({
      user_id: user.id,
      date: result.date,
      store_name: result.store_name,
      amount: result.amount,
      category,
      image_url: imageUrl,
    })

    if (error) { setError('保存に失敗しました'); setSaving(false); return }
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f7f5f2]">
        <span className="text-5xl animate-pulse">🤖</span>
        <p className="text-gray-400 font-medium">AIで読み取り中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 bg-[#f7f5f2]">
        <span className="text-5xl">😵</span>
        <p className="text-gray-700 font-semibold">読み取りに失敗しました</p>
        <p className="text-sm text-gray-400 text-center">{error}</p>
        <button
          onClick={() => router.push('/upload')}
          className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold px-8 py-4 rounded-2xl"
        >
          再アップロード
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">内容を確認</p>
        <p className="text-white/70 text-sm mt-1">内容を確認して保存してください</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl pt-5 px-4 space-y-3">
        <div className="bg-white rounded-2xl divide-y divide-gray-50">
          {[
            { label: '日付', value: result?.date },
            { label: '店名', value: result?.store_name },
            { label: '金額', value: `¥${result?.amount.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-400">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}

          {/* カテゴリ選択 */}
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-400">カテゴリ</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none text-right"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push('/upload')}
            className="flex-1 bg-white text-gray-500 font-semibold py-4 rounded-2xl text-sm"
          >
            やり直す
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f5f2]">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
