FROM node:20-bullseye-slim AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN apt-get update && \
    apt-get install -y build-essential python3 g++ libvips-dev --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .
RUN pnpm install

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml astro.config.mjs ./

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install

ENV HOST=0.0.0.0 PORT=4322 VITE_ALLOW_EXTERNAL_HOSTS=true
EXPOSE 4322

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "4322", "--allowed-hosts", "blog.tapanmeena.com"]
