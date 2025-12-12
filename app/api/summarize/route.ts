import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isRateLimited } from '@/lib/rate-limit'

/**
 * Request body schema validation
 */
const RequestSchema = z.object({
  abstract: z.string().min(1, 'abstract is required'),
})

/**
 * Hugging Face API response types
 * Can be either an array or a single object
 */
type HFResponseArray = Array<{ generated_text: string }>
type HFResponseObject = { generated_text: string }
type HFResponse = HFResponseArray | HFResponseObject

/**
 * Extract IP address from request headers
 */
function getClientIp(request: NextRequest): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default if no IP found
  return 'unknown'
}

/**
 * POST /api/summarize
 * Endpoint to summarize Alzheimer/neurodegenerative disease abstracts
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request)
    
    // Check rate limit
    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = RequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'abstract is required' },
        { status: 400 }
      )
    }

    const { abstract } = validation.data

    // Check for HF API token
    const hfToken = process.env.HF_API_TOKEN
    if (!hfToken) {
      console.error('HF_API_TOKEN is not configured')
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      )
    }

    // Prepare the prompt for the model
    const prompt = `Summarize the following abstract in 2-3 sentences, focusing ONLY on the main results and conclusions. Do NOT add information that is not present in the abstract.\n\n${abstract}`

    // Call Hugging Face Inference API
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/furkanyagiz/flan-t5-base-alzheimer-ultra-safe',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
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
      }
    )

    // Handle HF API errors
    if (!hfResponse.ok) {
      const errorText = await hfResponse.text()
      console.error('Hugging Face API error:', {
        status: hfResponse.status,
        statusText: hfResponse.statusText,
        body: errorText,
      })
      return NextResponse.json(
        { error: 'Hugging Face API error' },
        { status: 500 }
      )
    }

    // Parse response
    const data = await hfResponse.json() as HFResponse

    // Extract generated text from response
    let summary: string

    if (Array.isArray(data)) {
      // Response is an array
      if (data.length > 0 && data[0].generated_text) {
        summary = data[0].generated_text
      } else {
        console.warn('Unexpected HF response format (empty array):', data)
        return NextResponse.json(
          { error: 'Invalid response from summarization service' },
          { status: 500 }
        )
      }
    } else if (data && typeof data === 'object' && 'generated_text' in data) {
      // Response is an object
      summary = data.generated_text
    } else {
      console.warn('Unexpected HF response format:', data)
      return NextResponse.json(
        { error: 'Invalid response from summarization service' },
        { status: 500 }
      )
    }

    // Return the summary
    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Unexpected error in /api/summarize:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
