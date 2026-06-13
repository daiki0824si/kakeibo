'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Receipt } from '@/lib/types'
import { CATEGORY_STYLE } from '@/lib/categories'

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const style = CATEGORY_STYLE[receipt.category] ?? CATEGORY_STYLE['その他']

  const handleDelete = async () => {
    if (!confirm('このレシートを削除しますか？')) return
    setDeleting(true)
    await supabase.from('receipts').delete().eq('id', receipt.id)
    router.refresh()
  }

  return (
    <div className={`rounded-2xl p-4 flex items-center justify-between shadow-sm card-hover ${style.bg}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{style.emoji}</span>
        <div>
          <p className={`font-semibold text-sm ${style.text}`}>{receipt.store_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{receipt.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={`font-bold text-base ${style.text}`}>{receipt.amount.toLocaleString()}円</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 ${style.text}`}>
            {receipt.category}
          </span>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 text-lg leading-none btn-press"
        >
          ×
        </button>
      </div>
    </div>
  )
}
