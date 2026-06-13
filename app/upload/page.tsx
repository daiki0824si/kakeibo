'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
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
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">レシートを追加</p>
        <p className="text-white/70 text-sm mt-1">画像またはPDFをアップロード</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl min-h-screen pt-8 px-4 flex flex-col items-center gap-6">
        <button
          className="w-full max-w-sm bg-white border-2 border-dashed border-orange-200 rounded-3xl py-14 flex flex-col items-center gap-3 active:bg-orange-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="text-6xl">📷</span>
          <span className="text-orange-400 font-semibold">タップして選択</span>
          <span className="text-gray-300 text-xs">JPG / PNG / PDF</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />

        {uploading && (
          <div className="text-center space-y-2">
            <p className="text-orange-400 font-medium">アップロード中...</p>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <BottomNav />
    </div>
  )
}
