# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
ENV NODE_ENV=production
WORKDIR /srv/api

# Enable Corepack so pnpm is available when we add the API implementation.
RUN corepack enable pnpm && corepack pnpm --version

# Copy workspace manifests now so layer caching works once app code is in place.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Placeholder install step – this will be replaced with `pnpm install --filter packages/api...`
RUN echo "API Dockerfile scaffold ready. Add pnpm install/build steps during US1." > /srv/api/README.docker

# Final stage simply keeps the container alive until the Fastify app is implemented.
CMD ["bash", "-lc", "echo 'API container placeholder – implement pnpm build/start during US1' && tail -f /dev/null"]
