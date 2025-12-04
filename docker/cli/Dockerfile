ARG BUILD_SHA=local
ARG BUILD_VERSION=dev

FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_VERSION=0.4.18 \
    CLI_JOB_STORE=/data/jobs.sqlite

WORKDIR /srv/cli

RUN pip install --no-cache-dir "uv==${UV_VERSION}"

COPY packages/cli/pyproject.toml ./pyproject.toml
COPY packages/cli/uv.lock ./uv.lock
COPY packages/cli/README.md ./README.md
COPY packages/cli/src ./src

RUN uv pip install --system .

COPY packages/cli/scripts/docker-entrypoint.sh /usr/local/bin/metadata-cli-entrypoint
RUN chmod +x /usr/local/bin/metadata-cli-entrypoint

LABEL org.opencontainers.image.source="https://github.com/ganesh47/sqlite-metadata-proposal" \
      org.opencontainers.image.revision="${BUILD_SHA}" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.title="SQLite Metadata CLI" \
      org.opencontainers.image.description="Typer-based ingestion CLI for the SQLite metadata platform"

RUN useradd --create-home --shell /bin/bash metadata && \
    mkdir -p /data && chown -R metadata:metadata /srv/cli /data

USER metadata

ENTRYPOINT ["/usr/local/bin/metadata-cli-entrypoint"]
CMD ["ingest", "--help"]
