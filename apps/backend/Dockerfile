FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@11.6.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS db-init
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
USER node
CMD ["sh", "-c", "pnpm --filter=backend db:migrate && pnpm --filter=backend db:seed"]

FROM deps AS build
COPY turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
RUN pnpm run build --filter=backend --filter=@flagix/shared

FROM build AS deployed
RUN pnpm --filter=backend --legacy deploy /prod && \
    rm -rf /prod/src /prod/test /prod/dist-erd /prod/.turbo /prod/.env /prod/.env.example /prod/.prettierrc /prod/Dockerfile /prod/README.md /prod/drizzle.config.ts /prod/eslint.config.mjs /prod/nest-cli.json /prod/tsconfig.json /prod/tsconfig.build.json /prod/*.log /prod/*.err /prod/temp_*.json /prod/node_modules/.cache

FROM node:22-slim AS production
COPY --chown=node:node --from=deployed /prod /app
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 9000
USER node
CMD ["node", "dist/src/main.js"]
