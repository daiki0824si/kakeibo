export type Receipt = {
  id: string
  user_id: string
  date: string
  store_name: string
  amount: number
  category: string
  image_url: string | null
  raw_ai_response: Record<string, unknown> | null
  created_at: string
}
