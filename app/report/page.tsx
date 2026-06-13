'use client'

import { useState } from 'react'
import { BottomNav } from '@/components/bottom-nav'

type ReportData = {
  summary: string
  total?: number
  byCategory?: Record<string, number>
  advice: string
}

export default function ReportPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/report')
      if (!res.ok) throw new Error('レポートの生成に失敗しました')
      setReport(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">週次レポート</p>
        <p className="text-white/70 text-sm mt-1">過去7日間の支出を分析</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl min-h-screen pt-5 px-4 space-y-3">
        {!report && (
          <div className="text-center py-16 space-y-4">
            <p className="text-5xl">📊</p>
            <p className="text-gray-400 text-sm">ボタンを押して今週の支出を分析します</p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold px-8 py-4 rounded-2xl shadow text-base disabled:opacity-50 btn-press"
            >
              {loading ? '生成中...' : '今週のレポートを見る'}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {report && (
          <>
            {report.byCategory && (
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">カテゴリ別支出</p>
                <div className="space-y-2">
                  {Object.entries(report.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{cat}</span>
                        <span className="font-semibold text-gray-800">¥{amt.toLocaleString()}</span>
                      </div>
                    ))}
                  {report.total !== undefined && (
                    <div className="flex justify-between items-center text-sm font-bold border-t border-gray-100 pt-2 mt-2">
                      <span>合計</span>
                      <span className="text-orange-500">¥{report.total.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AIアドバイス</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.advice}</p>
            </div>

            <button
              onClick={() => setReport(null)}
              className="w-full text-center text-gray-400 text-sm py-2 btn-press"
            >
              再生成する
            </button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
