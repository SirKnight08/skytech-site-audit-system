export type SecurityHeaderSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'info'

export type SecurityHeaderResult = {
  header: string
  exists: boolean
  value: string | null
  status: 'pass' | 'fail'
  severity: SecurityHeaderSeverity
  explanation: string
  recommendation: string
}

export type AuditSuccessResponse = {
  url: string
  status: 'ok'
  security_headers: SecurityHeaderResult[]
}

export type AuditErrorResponse = {
  status: 'error'
  error: string
  message: string
}

export type AuditResponse = AuditSuccessResponse | AuditErrorResponse


export async function runAudit(url: string): Promise<AuditResponse> {
  const endpoint = process.env.NEXT_PUBLIC_AUDIT_ENDPOINT
  if (!endpoint) {
    return {
      status: 'error',
      error: 'client_config_missing',
      message: 'Missing NEXT_PUBLIC_AUDIT_ENDPOINT environment variable for the audit API.',
    }
  }


  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })

  const data: unknown = await res
    .json()
    .catch(() => ({ error: 'Invalid JSON response', message: 'Audit API returned non-JSON' }))

  if (!res.ok) {
    const err = data as Partial<AuditErrorResponse>
    return {
      status: 'error',
      error: err.error || `Audit request failed with status ${res.status}`,
      message: err.message || 'Audit API request failed',
    }
  }

  return data as AuditResponse
}


