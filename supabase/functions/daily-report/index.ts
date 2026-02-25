import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async () => {
  try {
    const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN")
    const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response("Missing environment variables", { status: 500 })
    }

    const today = new Date().toISOString().split("T")[0]

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/replanting_records?tanggal=eq.${today}`,
      {
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
        }
      }
    )

    const data = await response.json()

    const total = data.reduce(
      (sum: number, item: any) => sum + Number(item.output_kerja || 0),
      0
    )

    const message = `
📊 REKAP HARIAN REPLANTING

Tanggal: ${today}
Jumlah Data: ${data.length}
Total Output: ${total}
`

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    })

    return new Response("Success", { status: 200 })

  } catch (error) {
    return new Response(`Error: ${error}`, { status: 500 })
  }
})