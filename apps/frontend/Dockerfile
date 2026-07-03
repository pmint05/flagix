FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend
ARG VITE_API_BASE_URL
ARG VITE_AUTH_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_AUTH_BASE_URL=${VITE_AUTH_BASE_URL}
RUN pnpm run build --filter=frontend --filter=@flagix/shared

FROM node:22-slim AS production
COPY --chown=node:node --from=build /app /app
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "node_modules/vite/bin/vite.js", "preview", "--port", "3000", "--host", "0.0.0.0"]
