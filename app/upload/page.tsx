'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFile = async (file: File) => {
    setError(null)
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未認証')

      let uploadFile = file
      const mimeType = file.type

      if (file.type.startsWith('image/')) {
        uploadFile = await imageCompression(file, {
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        })
      }

      const ext = file.name.split('.').pop()
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, uploadFile, { contentType: mimeType })

      if (uploadError) throw new Error('アップロードに失敗しました')

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)

      const params = new URLSearchParams({ imageUrl: publicUrl, mimeType })
      router.push(`/upload/confirm?${params}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="text-center">
        <h1 className="text-xl font-bold">レシートを追加</h1>
        <p className="text-gray-500 text-sm mt-1">画像またはPDFをアップロード</p>
      </div>

      <button
        className="w-full max-w-sm border-2 border-dashed border-orange-300 rounded-3xl p-10 text-center bg-white/60 active:bg-orange-50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-5xl mb-3">📷</p>
        <p className="text-sm font-medium text-orange-500">タップして選択</p>
        <p className="text-xs text-gray-400 mt-1">JPG / PNG / PDF</p>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {uploading && <p className="text-sm text-orange-500 font-medium">アップロード中...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={() => router.push('/')}
        className="text-gray-400 text-sm underline active:opacity-60"
      >
        キャンセル
      </button>
    </div>
  )
}
