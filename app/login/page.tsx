export default function LoginPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const redirectTo = 'http://192.168.3.22:3000/auth/callback'
  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🧾 家計簿</h1>
          <p className="text-gray-500 mt-1">レシートを撮って支出を管理</p>
        </div>
        <a
          href={oauthUrl}
          style={{
            display: 'inline-block',
            background: 'linear-gradient(to right, #fb923c, #ec4899)',
            color: 'white',
            fontWeight: 'bold',
            padding: '16px 32px',
            borderRadius: '16px',
            fontSize: '18px',
            textDecoration: 'none',
          }}
        >
          Googleでログイン
        </a>
      </div>
    </div>
  )
}
