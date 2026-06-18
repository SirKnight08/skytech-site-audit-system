type SecurityHeaderKey =
  | 'Content-Security-Policy'
  | 'Strict-Transport-Security'
  | 'X-Frame-Options'
  | 'X-Content-Type-Options'
  | 'Referrer-Policy'
  | 'Permissions-Policy'

export type SecurityHeaderSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'info'

type SecurityHeaderResult = {
  header: SecurityHeaderKey
  exists: boolean
  value: string | null
  status: 'pass' | 'fail'
  severity: SecurityHeaderSeverity
  explanation: string
  recommendation: string
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

function getSeverity(header: SecurityHeaderKey): SecurityHeaderSeverity {
  // MVP defaults until we implement more sophisticated scoring.
  switch (header) {
    case 'Strict-Transport-Security':
      return 'high'
    case 'Content-Security-Policy':
      return 'high'
    case 'X-Frame-Options':
      return 'medium'
    case 'X-Content-Type-Options':
      return 'medium'
    case 'Referrer-Policy':
      return 'low'
    case 'Permissions-Policy':
      return 'low'
    default:
      return 'info'
  }
}

function getRecommendation(header: SecurityHeaderKey): string {
  switch (header) {
    case 'Content-Security-Policy':
      return 'Add a Content-Security-Policy header to reduce XSS and data injection risk.'
    case 'Strict-Transport-Security':
      return 'Enable Strict-Transport-Security (HSTS) to enforce HTTPS.'
    case 'X-Frame-Options':
      return 'Set X-Frame-Options to mitigate clickjacking (e.g., DENY or SAMEORIGIN).'
    case 'X-Content-Type-Options':
      return 'Set X-Content-Type-Options to prevent MIME-sniffing (e.g., nosniff).'
    case 'Referrer-Policy':
      return 'Set a Referrer-Policy appropriate for your privacy needs.'
    case 'Permissions-Policy':
      return 'Add a Permissions-Policy to control access to browser features.'
    default:
      return 'Add the recommended security header.'
  }
}

function evaluateHeader(header: SecurityHeaderKey, value: string | null): SecurityHeaderResult {
  const exists = value !== null && value.trim().length > 0

  // MVP evaluation: pass if header exists and has a non-empty value.
  const status: 'pass' | 'fail' = exists ? 'pass' : 'fail'
  const severity = getSeverity(header)

  let explanation = 'Header is missing.'
  if (exists) {
    explanation = `Header is present with a value: ${value}`
  }

  return {
    header,
    exists,
    value,
    status,
    severity,
    explanation,
    recommendation: getRecommendation(header),
  }
}


type AuditErrorResponse = {
  status: 'error'
  error: string
  message: string
}

type AuditSuccessResponse = {
  url: string
  status: 'ok'
  security_headers: SecurityHeaderResult[]
}

type AuditResponse = AuditSuccessResponse | AuditErrorResponse

export async function handleAuditPost(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return json({ status: 'error', error: 'bad_request', message: 'Content-Type must be application/json' } satisfies AuditErrorResponse, 415)
    }

    const body: unknown = await request.json().catch(() => null)
    const targetUrl = validateUrl((body as any)?.url)


    const targetResp = await fetch(targetUrl, {

      method: 'GET',
      redirect: 'follow',
      // Avoid sending cookies from the worker environment
      headers: {
        'user-agent': 'skytech-site-audit-worker',
      },
    })

    const results: SecurityHeaderResult[] = SECURITY_HEADERS.map((h) => {
      const value = targetResp.headers.get(h)

      return evaluateHeader(h, value)
    })

    const resp: AuditSuccessResponse = {
      url: targetUrl,
      status: 'ok',
      security_headers: results,
    }

    return json(resp)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const resp: AuditErrorResponse = {
      status: 'error',
      error: 'audit_failed',
      message,
    }
    return json(resp, 400)
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

