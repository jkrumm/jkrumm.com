# syntax=docker/dockerfile:1
FROM oven/bun:1.4.1-slim AS builder
WORKDIR /app

# git: the footer's build commit and each article's last-modified date come
# from `git log` at build time (src/utils/content.ts).
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

COPY . .
# astro check + build. Fetches the GitHub heatmap and Fontsource fonts at build
# time — the daily scheduled deploy exists to refresh the former.
RUN bun run build

FROM nginx:1.30-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
