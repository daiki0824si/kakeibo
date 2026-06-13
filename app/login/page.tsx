import LoginButton from '@/components/login-button'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🧾 家計簿</h1>
          <p className="text-gray-500 mt-1">レシートを撮って支出を管理</p>
        </div>
        <LoginButton />
      </div>
    </div>
  )
}
