FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_VERSION=0.4.18

WORKDIR /srv/cli

RUN pip install --no-cache-dir "uv==${UV_VERSION}"

COPY packages/cli/pyproject.toml ./pyproject.toml
COPY packages/cli/uv.lock ./uv.lock
COPY packages/cli/README.md ./README.md
COPY packages/cli/src ./src

RUN uv pip install --system --frozen .

COPY packages/cli/scripts/docker-entrypoint.sh /usr/local/bin/metadata-cli-entrypoint
RUN chmod +x /usr/local/bin/metadata-cli-entrypoint

ENTRYPOINT ["/usr/local/bin/metadata-cli-entrypoint"]
CMD ["ingest", "--help"]
