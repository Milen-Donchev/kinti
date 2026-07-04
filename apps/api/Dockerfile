FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/api apps/api

RUN bun --cwd apps/api prisma generate
RUN bun --cwd apps/api build


FROM node:22-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

EXPOSE 3000

CMD ["node", "apps/api/dist/src/main.js"]