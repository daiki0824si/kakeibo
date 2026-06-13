import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/lib/categories'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 })

  const { imageUrl, mimeType } = await request.json()

  // Supabase StorageからファイルをDL
  const path = imageUrl.split('/receipts/')[1]
  const { data, error } = await supabase.storage.from('receipts').download(path)
  if (error || !data) return NextResponse.json({ error: 'ファイルの取得に失敗しました' }, { status: 500 })

  const buffer = await data.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  const isPdf = mimeType === 'application/pdf'

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          isPdf
            ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
            : { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          {
            type: 'text',
            text: `以下はレシートまたは領収書です。
次のJSONのみを返してください（説明不要）:
{
  "date": "YYYY-MM-DD",
  "store_name": "店名",
  "amount": 金額(整数・円),
  "category": "${CATEGORIES.join('|')}"
}
抽出できない場合は {"error": "理由"} を返してください。`,
          },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result, rawResponse: text })
  } catch {
    return NextResponse.json({ error: '抽出結果のパースに失敗しました', rawResponse: text }, { status: 422 })
  }
}
