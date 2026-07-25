# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage — installs the full npm workspace (needed because
# @cricket-platform/shared is a workspace dependency of the API) and
# compiles both the shared package and the API to plain JS.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /workspace

# All three workspace manifests are copied (even though this image only
# builds api + shared) so npm ci sees the same workspace topology recorded
# in package-lock.json — omitting a declared workspace's package.json here
# causes npm to reconcile a lockfile that references it against a tree that
# doesn't, which is a common source of flaky "npm ci" failures in partial
# monorepo build contexts.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace packages/shared \
 && npx prisma generate --schema apps/api/prisma/schema.prisma \
 && npm run build --workspace apps/api

# ---------------------------------------------------------------------------
# Runtime stage — slim image, no source or dev toolchain.
#
# Note: this copies the full workspace node_modules from the build stage
# rather than a per-package-pruned install. npm workspaces don't ship a
# built-in "deploy" prune the way pnpm/turborepo do; if image size becomes a
# concern, switch to pnpm or add `npm-prune-workspace` / turborepo here.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/packages/shared/dist ./packages/shared/dist
COPY --from=build /workspace/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build /workspace/apps/api/openapi.yaml ./apps/api/openapi.yaml
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json

RUN mkdir -p /app/apps/api/uploads && chown -R app:app /app
USER app

WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:4000/healthz', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]
