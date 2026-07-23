FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/web apps/web

RUN bun --cwd apps/web build


FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/docker-entrypoint.d/40-generate-runtime-config.sh /docker-entrypoint.d/40-generate-runtime-config.sh
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-generate-runtime-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
