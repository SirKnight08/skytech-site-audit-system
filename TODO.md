# TODO - SkyTech Site Audit System

## Option A: Align backend response shape with frontend `AuditResult` types (security headers MVP)

- [ ] Update `frontend/lib/audit.ts` types to match the required API contract (including security header fields)
- [ ] Update `backend/src/handlers/audit.ts` to return: `{ url, status, security_headers }` where each header includes `severity` + `recommendation` and any required fields
- [ ] Ensure backend error response matches requirement: `{ status, error, message }` (and set proper HTTP status codes)
- [ ] Ensure frontend `runAudit()` consumes both success/error responses without extra transformations (strong typing)
- [ ] Verify TypeScript compilation for both backend and frontend


