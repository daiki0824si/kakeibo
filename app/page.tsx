import { createClient } from '@/lib/supabase/server'
import { Receipt } from '@/lib/types'
import { ReceiptCard } from '@/components/receipt-card'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: receipts } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user!.id)
    .order('date', { ascending: false })

  const monthTotal = (receipts ?? [])
    .filter((r: Receipt) => r.date >= monthStart)
    .reduce((sum: number, r: Receipt) => sum + r.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-3xl p-5 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80">今月の支出</p>
          <p className="text-4xl font-bold mt-1">{monthTotal.toLocaleString()}<span className="text-xl ml-1">円</span></p>
          <div className="flex gap-2 mt-4">
            <Link href="/report" className="flex-1 text-center bg-white/20 hover:bg-white/30 transition-colors rounded-xl py-2 text-sm font-medium">
              📊 レポート
            </Link>
            <Link href="/upload" className="flex-1 text-center bg-white text-orange-500 hover:bg-white/90 transition-colors rounded-xl py-2 text-sm font-bold shadow">
              ＋ レシート追加
            </Link>
          </div>
        </div>

        {/* 一覧 */}
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2 px-1">履歴</p>

          {(!receipts || receipts.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">🧾</p>
              <p className="text-sm">レシートを追加してみましょう</p>
            </div>
          )}

          <div className="space-y-2">
            {(receipts ?? []).map((r: Receipt) => (
              <ReceiptCard key={r.id} receipt={r} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
