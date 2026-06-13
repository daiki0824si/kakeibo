import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import LogoutButton from '@/components/logout-button'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-orange-400 to-pink-500 pt-12 pb-8 px-5">
        <p className="text-white text-2xl font-bold">設定</p>
      </div>

      <div className="bg-[#f7f5f2] -mt-4 rounded-t-3xl min-h-screen pt-5 px-4 space-y-3">
        {/* アカウント情報 */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">アカウント</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg">
              👤
            </div>
            <div>
              <p className="font-medium text-sm text-gray-800">{user?.email}</p>
              <p className="text-xs text-gray-400">Googleアカウント</p>
            </div>
          </div>
        </div>

        {/* ログアウト */}
        <div className="bg-white rounded-2xl p-4">
          <LogoutButton />
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
