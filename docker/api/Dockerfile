# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20.19.5
ARG BUILD_SHA=local
ARG BUILD_VERSION=dev

FROM node:${NODE_VERSION}-bookworm-slim AS build
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /workspace

# Install only the dependencies needed for the API workspace.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/api/package.json packages/api/package.json
RUN pnpm install --frozen-lockfile --filter metadata-api...

# Copy the remaining workspace now that dependencies are cached.
COPY packages packages

RUN pnpm --filter metadata-api run build && \
    pnpm deploy --filter metadata-api --prod /opt/app

FROM node:${NODE_VERSION}-bookworm-slim AS runner

ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=8080 \
    SQLITE_PATH=/var/lib/sqlite/metadata.sqlite

WORKDIR /srv/api

LABEL org.opencontainers.image.source="https://github.com/ganesh47/sqlite-metadata-proposal" \
      org.opencontainers.image.revision="${BUILD_SHA}" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.title="SQLite Metadata API" \
      org.opencontainers.image.description="Fastify + Drizzle API packaged for SQLite metadata service"

COPY --from=build /opt/app .

RUN mkdir -p /var/lib/sqlite && \
    chown -R node:node /srv/api /var/lib/sqlite

USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
