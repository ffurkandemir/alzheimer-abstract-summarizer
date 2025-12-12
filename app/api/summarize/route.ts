// app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

// VPS'teki FastAPI backend'in
const BACKEND_URL = 'http://68.183.68.119:8000/summarize'

// Request body şeması
const RequestSchema = z.object({
  abstract: z.string().min(1, 'abstract is required'),
})

// Backend'in döndüreceği JSON tipi
interface BackendResponse {
  summary: string
}

// IP çekmek için ufak helper
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()

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
    const clientIp = getClientIp(request)

    // Basit rate limit
    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    // Body parse + validation
    const rawBody = await request.json().catch(() => null)
    const validation = RequestSchema.safeParse(rawBody)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'abstract is required' },
        { status: 400 },
      )
    }

    const { abstract } = validation.data

    // VPS'teki FastAPI backend'e istek at
    const backendRes = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ abstract }),
    })

    const text = await backendRes.text()

    if (!backendRes.ok) {
      console.error('Backend error:', backendRes.status, text)
      return NextResponse.json(
        {
          error: 'Summarization backend error',
          status: backendRes.status,
          details: text,
        },
        { status: 500 },
      )
    }

    // JSON parse (tipli)
    let data: BackendResponse
    try {
      data = JSON.parse(text) as BackendResponse
    } catch (e) {
      console.error('Failed to parse backend JSON:', e, text)
      return NextResponse.json(
        { error: 'Invalid JSON from backend' },
        { status: 500 },
      )
    }

    const { summary } = data

    if (!summary || typeof summary !== 'string') {
      console.error('Backend returned invalid summary:', data)
      return NextResponse.json(
        { error: 'Backend returned no summary' },
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
