import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data: receipts, error } = await supabase
    .from('receipts')
    .select('date, store_name, amount, category')
    .eq('user_id', user.id)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ summary: 'この週のレシートはまだありません。', advice: 'レシートを登録してみましょう！' })
  }

  const total = receipts.reduce((sum, r) => sum + r.amount, 0)
  const byCategory = receipts.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount
    return acc
  }, {})

  const summaryText = Object.entries(byCategory)
    .map(([cat, amt]) => `${cat}: ${amt.toLocaleString()}円`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `以下は過去7日間の支出データです。
合計: ${total.toLocaleString()}円

カテゴリ別:
${summaryText}

この支出について、日本語で2〜3文の改善提案をしてください。具体的で実践的なアドバイスをお願いします。`,
      },
    ],
  })

  const advice = message.content[0].type === 'text' ? message.content[0].text : ''

  return NextResponse.json({ summary: summaryText, total, byCategory, advice })
}
