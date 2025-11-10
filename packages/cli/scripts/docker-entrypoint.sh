#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "shell" ]]; then
  exec "${SHELL:-/bin/bash}"
fi

exec metadata-cli "$@"
