export type AuditResponse = {
  security?: { headers?: Record<string, any>; summary?: string };
  ssl?: { ok?: boolean; summary?: string };
  performance?: { score?: number; summary?: string };
  seo?: { summary?: string };
  techStack?: { summary?: string };
  error?: string;
};

export async function runAudit(url: string): Promise<AuditResponse> {
  const endpoint = process.env.NEXT_PUBLIC_AUDIT_ENDPOINT;
  if (!endpoint) {
    return {
      error:
        "Missing NEXT_PUBLIC_AUDIT_ENDPOINT environment variable for the audit API."
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    return {
      error:
        data?.error ||
        `Audit request failed with status ${res.status}`
    };
  }

  return data as AuditResponse;
}

