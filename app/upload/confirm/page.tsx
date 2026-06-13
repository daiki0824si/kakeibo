'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Suspense } from 'react'

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

    if (error) {
      setError('保存に失敗しました')
      setSaving(false)
      return
    }
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">AIで読み取り中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
        <p className="text-destructive font-medium">読み取りに失敗しました</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/upload')}>再アップロード</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
      <h1 className="text-xl font-bold">内容を確認</h1>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base">読み取り結果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">日付</span>
            <span>{result?.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">店名</span>
            <span>{result?.store_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">金額</span>
            <span className="font-bold">{result?.amount.toLocaleString()}円</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">カテゴリ</span>
            <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 w-full max-w-sm">
        <Button variant="outline" className="flex-1" onClick={() => router.push('/upload')}>
          やり直す
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存する'}
        </Button>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">読み込み中...</p></div>}>
      <ConfirmContent />
    </Suspense>
  )
}
