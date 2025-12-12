// app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

// 🔹 Hugging Face model id (HUB’daki ile birebir aynı!)
const HF_MODEL_ID = 'furkanyagiz/flan-t5-base-alzheimer-ultra-safe'

// 🔹 HF Inference router URL (resmi dokümandaki pattern)
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL_ID}`

/**
 * Request body schema validation
 */
const RequestSchema = z.object({
  abstract: z.string().min(1, 'abstract is required'),
})

/**
 * HF response tipleri
 * (Inference API genelde generated_text döndürüyor,
 * ama güvenli olmak için summary_text’i de destekleyelim.)
 */
type HFGenerated = { generated_text?: string; summary_text?: string }
type HFResponse = HFGenerated | HFGenerated[]

/**
 * IP adresini header'lardan çek
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

/**
 * POST /api/summarize
 * Alzheimer / nörodejeneratif abstract özetleme endpoint'i
 */
export async function POST(request: NextRequest) {
  try {
    // 🧊 Rate limit
    const clientIp = getClientIp(request)
    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    // 🧾 Body parse + validation
    const rawBody = await request.json().catch(() => null)
    const validation = RequestSchema.safeParse(rawBody)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'abstract is required' },
        { status: 400 },
      )
    }

    const { abstract } = validation.data

    // 🔑 HF token kontrolü
    const hfToken = process.env.HF_API_TOKEN
    if (!hfToken) {
      console.error('HF_API_TOKEN is not configured')
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 },
      )
    }

    // 🧠 Modele gidecek prompt
    const prompt =
      'Summarize the following abstract in 2-3 sentences, focusing ONLY on the main results and conclusions. ' +
      'Do NOT add information that is not present in the abstract.\n\n' +
      abstract

    // 📡 Hugging Face HF Inference çağrısı
    const hfResponse = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 256,
          num_beams: 4,
          do_sample: false,
        },
      }),
    })

    const rawText = await hfResponse.text()

    // ❌ HF tarafında hata varsa detaylı logla + kullanıcıya döndür
    if (!hfResponse.ok) {
      console.error('Hugging Face API error:', {
        status: hfResponse.status,
        statusText: hfResponse.statusText,
        body: rawText,
      })

      return NextResponse.json(
        {
          error: 'Hugging Face API error',
          status: hfResponse.status,
          details: rawText,
        },
        { status: 500 },
      )
    }

    // 🧩 JSON parse
    let data: HFResponse
    try {
      data = JSON.parse(rawText) as HFResponse
    } catch (e) {
      console.error('Failed to parse HF response JSON:', e, rawText)
      return NextResponse.json(
        { error: 'Failed to parse Hugging Face response' },
        { status: 500 },
      )
    }

    // 🔍 generated_text / summary_text çıkar
    let summary: string | undefined

    const pickText = (obj: HFGenerated | undefined | null) =>
      obj?.generated_text || obj?.summary_text

    if (Array.isArray(data)) {
      summary = pickText(data[0])
    } else if (data && typeof data === 'object') {
      summary = pickText(data)
    }

    if (!summary) {
      console.warn('Unexpected HF response format:', data)
      return NextResponse.json(
        { error: 'Invalid response from summarization service' },
        { status: 500 },
      )
    }

    // ✅ Başarılı cevap
    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Unexpected error in /api/summarize:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
