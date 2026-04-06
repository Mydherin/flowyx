# ── Stage 1: Build ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
# package-lock.json is NOT copied: it was generated on Windows and locks the
# win32 native binding for rolldown. Omitting it lets npm resolve the correct
# linux-x64-musl binding for Alpine at install time.
RUN npm install

# VITE_GOOGLE_CLIENT_ID must be available at build time because
# import.meta.env is resolved by Vite during compilation, not at runtime.
# VITE_API_BASE_URL is intentionally NOT set so the frontend uses
# relative paths ('' fallback) — nginx proxies them to the backend.
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY . .
RUN npm run build

# ── Stage 2: Serve ───────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/flowyx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
