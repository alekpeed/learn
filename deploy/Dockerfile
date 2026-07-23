# Example production image for the client SPA (doc 15 §3).
# Build stage: install with the frozen lockfile and produce the static bundle.
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Serve stage: static files behind nginx with SPA fallback.
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 8080
