'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import { BottomNav } from '@/components/bottom-nav'

export default function UploadPage() {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = async (file: File) => {
    setError(null)
    setProcessing(true)

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(compressed)
      })

      const mimeType = compressed.type || file.type

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType }),
      })

      const json = await res.json()
      if (!res.ok || !json.result) throw new Error(json.error ?? '読み取りに失敗しました')

      sessionStorage.setItem('extractedReceipt', JSON.stringify(json.result))
      router.push('/upload/confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
      setProcessing(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">レシートを追加</p>
        <p className="text-white/70 text-sm mt-1">写真を撮って品目を自動読み取り</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl min-h-screen pt-8 px-4 flex flex-col items-center gap-6">
        <button
          className="w-full max-w-sm bg-white border-2 border-dashed border-orange-200 rounded-3xl py-14 flex flex-col items-center gap-3 btn-press hover:border-orange-300 hover:bg-orange-50/50 transition-colors disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
        >
          <span className="text-6xl">{processing ? '🤖' : '📷'}</span>
          <span className="text-orange-400 font-semibold">
            {processing ? 'AI読み取り中...' : 'タップして撮影・選択'}
          </span>
          <span className="text-gray-300 text-xs">JPG / PNG</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />

        {error && (
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-2xl px-4 py-3 w-full max-w-sm">
            {error}
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
