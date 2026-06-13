import { createClient } from '@/lib/supabase/server'
import { Receipt } from '@/lib/types'
import { ReceiptCard } from '@/components/receipt-card'
import { BottomNav } from '@/components/bottom-nav'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`

  const { data: receipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user!.id)
    .order('date', { ascending: false })

  const monthReceipts = (receipts ?? []).filter((r: Receipt) => r.date >= monthStart)
  const monthTotal = monthReceipts.reduce((sum: number, r: Receipt) => sum + r.amount, 0)
  const monthCount = monthReceipts.length

  return (
    <div className="min-h-screen pb-20">
      {/* ヘッダーカード */}
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white/70 text-sm font-medium">{monthLabel}の支出</p>
        <p className="text-white text-5xl font-bold mt-1 tracking-tight">
          ¥{monthTotal.toLocaleString()}
        </p>
        <p className="text-white/70 text-sm mt-2">{monthCount}件のレシート</p>
      </div>

      {/* 丸みのある白エリア */}
      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl min-h-screen pt-5 px-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">履歴</p>

        {(!receipts || receipts.length === 0) && (
          <div className="text-center py-20 text-gray-300">
            <p className="text-6xl mb-4">🧾</p>
            <p className="text-sm">レシートを追加してみましょう</p>
          </div>
        )}

        <div className="space-y-2">
          {(receipts ?? []).map((r: Receipt) => (
            <ReceiptCard key={r.id} receipt={r} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
