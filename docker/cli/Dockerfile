FROM python:3.12-slim AS base
ENV UV_PROJECT_ENV=/opt/cli
WORKDIR /srv/cli

# Install uv so future builds can sync the Typer project quickly.
RUN pip install --no-cache-dir uv==0.4.21

COPY packages/cli/pyproject.toml packages/cli/uv.lock ./
RUN uv pip sync ./uv.lock && echo "CLI Dockerfile scaffold ready. Add Typer sources + entrypoint later."

CMD ["bash", "-lc", "echo 'CLI container placeholder – run uv pip sync + metadata-cli once implemented' && tail -f /dev/null"]
