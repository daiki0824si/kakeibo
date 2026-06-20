export type Category = {
  id: string
  name: string
  created_at: string
}

export type Receipt = {
  id: string
  date: string
  store_name: string
  created_at: string
}

export type ReceiptItem = {
  id: string
  receipt_id: string
  name: string
  quantity: number
  unit_price: number
  subtotal: number
  category_id: string | null
  created_at: string
  category?: Category
}

export type ReceiptWithItems = Receipt & {
  receipt_items: (ReceiptItem & { category: Category | null })[]
}

// OCR 結果（確認画面用）
export type ExtractedItem = {
  name: string
  quantity: number
  unit_price: number
  subtotal: number
  category: string
}

export type ExtractedReceipt = {
  date: string
  store_name: string
  items: ExtractedItem[]
}
