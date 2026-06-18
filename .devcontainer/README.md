# DevContainer (Backend)

This configuration runs the Cloudflare Workers backend in a supported Linux environment.

## Start the container (VS Code)
1. Open the project in VS Code.
2. Press **Ctrl+Shift+P** (Cmd+Shift+P on macOS) and run:
   - **Dev Containers: Open Folder in Container**
3. Wait for container to start.
4. It will run `cd backend && npm install` automatically on first create.

## Commands (inside the container)
```bash
cd backend
npm run dev -- --ip 0.0.0.0 --port 8787
```

In another terminal inside the container:
```bash
curl -sS -X POST http://127.0.0.1:8787/audit \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com"}'
```

