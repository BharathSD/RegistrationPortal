# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /workspace

# See infra/docker/api.Dockerfile for why every workspace manifest is
# copied here even though this image only builds web + shared.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build --workspace packages/shared

# Vite inlines VITE_* env vars at build time, so the API base URL must be
# supplied as a build ARG (docker build --build-arg VITE_API_BASE_URL=...),
# not a runtime env var — there is no server process to read one from.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build --workspace apps/web

# ---------------------------------------------------------------------------
# Runtime stage — static build served by Nginx.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:80/ >/dev/null || exit 1
