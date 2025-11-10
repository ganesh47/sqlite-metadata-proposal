# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20.19.5

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
ENV NODE_ENV=production
WORKDIR /srv/api

COPY --from=build /opt/app .

EXPOSE 8080
CMD ["node", "dist/index.js"]
