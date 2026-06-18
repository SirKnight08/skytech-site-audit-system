FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Install Cloudflare Wrangler system prerequisites (if needed)
# Wrangler is installed via backend package.json devDependencies.

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

