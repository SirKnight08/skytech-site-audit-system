type SecurityHeaderKey =
  | 'Content-Security-Policy'
  | 'Strict-Transport-Security'
  | 'X-Frame-Options'
  | 'X-Content-Type-Options'
  | 'Referrer-Policy'
  | 'Permissions-Policy'

type SecurityHeaderResult = {
  header: SecurityHeaderKey
  exists: boolean
  value: string | null
  status: 'pass' | 'fail'
  explanation: string
}

const SECURITY_HEADERS: SecurityHeaderKey[] = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
]

function validateUrl(input: unknown): string {
  if (typeof input !== 'string') throw new Error('Request body must include a string "url"')
  const trimmed = input.trim()
  if (!trimmed) throw new Error('"url" must be a non-empty string')

  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    throw new Error('"url" must be a valid URL')
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('"url" must use http or https')
  }

  return u.toString()
}

function evaluateHeader(header: SecurityHeaderKey, value: string | null): SecurityHeaderResult {
  const exists = value !== null && value.trim().length > 0

  // MVP evaluation: pass if header exists and has a non-empty value.
  // (We can tighten logic later once endpoint works end-to-end.)
  const status: 'pass' | 'fail' = exists ? 'pass' : 'fail'

  let explanation = 'Header is missing.'
  if (exists) {
    explanation = `Header is present with a value: ${value}`
  }

  return {
    header,
    exists,
    value,
    status,
    explanation,
  }
}

export async function handleAuditPost(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return json({ error: 'Content-Type must be application/json' }, 415)
    }

    const body = await request.json().catch(() => null)
    const targetUrl = validateUrl(body?.url)

    const resp = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      // Avoid sending cookies from the worker environment
      headers: {
        'user-agent': 'skytech-site-audit-worker',
      },
    })

    const results: SecurityHeaderResult[] = SECURITY_HEADERS.map((h) => {
      const value = resp.headers.get(h)
      return evaluateHeader(h, value)
    })

    return json({
      url: targetUrl,
      status: 'ok',
      security_headers: results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({
      error: message,
      status: 'error',
    }, 400)
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

