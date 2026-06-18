import { handleAuditPost } from './handlers/audit'

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    const url = new URL(request.url)

    if (request.method === 'POST' && url.pathname === '/audit') {
      return handleAuditPost(request)
    }

    return new Response(JSON.stringify({
      error: 'Not found',
    }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  },
}


