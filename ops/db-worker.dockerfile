FROM oven/bun:1

WORKDIR /usr/src/app

COPY package.json bun.lock ./
COPY apps/client/package.json apps/client/package.json
COPY apps/db-worker/package.json apps/db-worker/package.json
COPY apps/engine/package.json apps/engine/package.json
COPY apps/http/package.json apps/http/package.json
COPY apps/ws/package.json apps/ws/package.json
COPY packages/common/package.json packages/common/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/redis/package.json packages/redis/package.json

RUN bun install

COPY . .

RUN chmod +x /usr/src/app/db-worker-entry.sh

ENTRYPOINT ["/usr/src/app/db-worker-entry.sh"]