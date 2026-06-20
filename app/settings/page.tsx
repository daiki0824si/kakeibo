'use client'

import { useState, useEffect } from 'react'
import { BottomNav } from '@/components/bottom-nav'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'
import { getCategoryColor } from '@/lib/categories'

export default function SettingsPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    setError(null)
    const { error: err } = await supabase.from('categories').insert({ name })
    if (err) {
      setError(err.message.includes('unique') ? 'そのカテゴリは既に存在します' : '追加に失敗しました')
    } else {
      setNewName('')
      await load()
    }
    setAdding(false)
  }

  const handleDelete = async (cat: Category) => {
    const { count } = await supabase
      .from('receipt_items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id)

    if ((count ?? 0) > 0) {
      alert(`「${cat.name}」は${count}件の品目で使用中のため削除できません`)
      return
    }
    if (!confirm(`「${cat.name}」を削除しますか？`)) return
    await supabase.from('categories').delete().eq('id', cat.id)
    await load()
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">設定</p>
        <p className="text-white/70 text-sm mt-1">カテゴリを管理する</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl min-h-screen pt-5 px-4 space-y-3">
        {/* カテゴリ追加 */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            カテゴリを追加
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none"
              placeholder="新しいカテゴリ名"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50 btn-press"
            >
              追加
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        {/* カテゴリ一覧 */}
        <div className="bg-white rounded-2xl divide-y divide-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
            カテゴリ一覧
          </p>
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(cat.name) }}
                />
                <span className="text-sm text-gray-800">{cat.name}</span>
              </div>
              <button
                onClick={() => handleDelete(cat)}
                className="text-gray-300 hover:text-red-400 text-sm btn-press"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
