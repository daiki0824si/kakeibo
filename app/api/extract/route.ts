import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    const { base64, mimeType } = await request.json()
    if (!base64 || !mimeType) {
      return NextResponse.json({ error: '画像データが不正です' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: categories } = await supabase.from('categories').select('name').order('name')
    const categoryNames = (categories ?? []).map((c: { name: string }) => c.name).join('|')

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      {
        inlineData: { mimeType, data: base64 },
      },
      `このレシートを解析して、以下のJSON形式のみを返してください（説明不要）:
{
  "date": "YYYY-MM-DD",
  "store_name": "店名",
  "items": [
    { "name": "品目名", "quantity": 数量(整数), "unit_price": 単価(整数・円), "subtotal": 小計(整数・円), "category": "${categoryNames}" }
  ]
}
日付が不明な場合は今日の日付、数量不明は1、カテゴリは最も近いものを選んでください。
抽出できない場合は {"error": "理由"} を返してください。`,
    ])

    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: '読み取り結果を解析できませんでした', rawResponse: text }, { status: 422 })
    }
    const parsed = JSON.parse(jsonMatch[0])
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 422 })
    return NextResponse.json({ result: parsed })

  } catch (e) {
    const message = e instanceof Error ? e.message : '不明なエラー'
    console.error('extract error:', message)
    return NextResponse.json({ error: `APIエラー: ${message}` }, { status: 500 })
  }
}
