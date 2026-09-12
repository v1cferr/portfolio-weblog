# syntax=docker/dockerfile:1

# Self-contained production image for the Next.js app. Vercel does not use this
# file; it exists so the site can be hosted anywhere else.

# Debian rather than Alpine: the deno devDependency ships no musl build, and
# glibc also matches the libc the Vercel builders use.
# Kept in step with flake.nix so local, CI and container builds agree.
ARG NODE_VERSION=22-bookworm-slim
ARG PNPM_VERSION=10.34.5

FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# Dependencies resolve from the lockfile alone, so this layer is reused for as
# long as the manifests are untouched.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/public ./public

# The standalone bundle carries the server and the subset of node_modules it
# actually imports; static assets are copied separately because Next leaves
# them out of it on purpose.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

# The node images already ship an unprivileged "node" user.
USER node
EXPOSE 3000

CMD ["node", "server.js"]
