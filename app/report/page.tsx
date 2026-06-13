'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  const router = useRouter()

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
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push('/')}>← 戻る</Button>
        <h1 className="text-xl font-bold">週次レポート</h1>
      </div>

      {!report && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-sm">過去7日間の支出を分析します</p>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? '生成中...' : '今週のレポートを見る'}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <div className="space-y-4">
          {report.byCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">カテゴリ別支出</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(report.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <span className="font-medium">{amt.toLocaleString()}円</span>
                    </div>
                  ))}
                {report.total !== undefined && (
                  <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                    <span>合計</span>
                    <span>{report.total.toLocaleString()}円</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">AIからのアドバイス</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{report.advice}</p>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => { setReport(null) }}>
            再生成する
          </Button>
        </div>
      )}
    </div>
  )
}
