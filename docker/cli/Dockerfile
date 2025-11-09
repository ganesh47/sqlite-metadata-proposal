FROM python:3.12-slim AS base
WORKDIR /srv/cli

COPY packages/cli/pyproject.toml ./
RUN echo "CLI Dockerfile scaffold ready. Add Typer sources + entrypoint later." > README.docker

CMD ["bash", "-lc", "echo 'CLI container placeholder – add Typer code before publishing image' && tail -f /dev/null"]
