'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ReceiptWithItems } from '@/lib/types'
import { getCategoryColor } from '@/lib/categories'

export function ReceiptCard({ receipt }: { receipt: ReceiptWithItems }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const total = receipt.receipt_items.reduce((sum, i) => sum + i.subtotal, 0)

  const handleDelete = async () => {
    if (!confirm('このレシートを削除しますか？')) return
    setDeleting(true)
    await supabase.from('receipts').delete().eq('id', receipt.id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 btn-press"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 text-left">
          <span className="text-2xl">🧾</span>
          <div>
            <p className="font-semibold text-sm text-gray-800">{receipt.store_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{receipt.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-bold text-base text-orange-500">¥{total.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{receipt.receipt_items.length}品目</p>
          </div>
          <span className="text-gray-300 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-3">
          <div className="space-y-1.5 pt-2">
            {receipt.receipt_items.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(item.category?.name ?? '') }}
                  />
                  <span className="text-gray-700 truncate">{item.name}</span>
                  <span className="text-gray-400 text-xs flex-shrink-0">×{item.quantity}</span>
                </div>
                <span className="font-medium text-gray-800 ml-2">¥{item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-50 flex justify-end">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 btn-press"
            >
              削除する
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
