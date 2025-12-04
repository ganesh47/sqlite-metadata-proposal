#!/usr/bin/env bash
# Build, push, SBOM, and sign images for API/CLI/connector.
# Requires: docker buildx, cosign (keyless or env vars set), and access to GHCR_PAT.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REGISTRY="${REGISTRY:-ghcr.io}"
GHCR_USERNAME="${GHCR_USERNAME:-${GITHUB_REPOSITORY_OWNER:-}}"
SHA="${SHA:-$(git rev-parse HEAD)}"
VERSION="${VERSION:-dev}"

API_IMAGE="${API_IMAGE:-${REGISTRY}/${GHCR_USERNAME}/sqlite-meta-api}"
CLI_IMAGE="${CLI_IMAGE:-${REGISTRY}/${GHCR_USERNAME}/sqlite-meta-cli}"
CONNECTOR_IMAGE="${CONNECTOR_IMAGE:-${REGISTRY}/${GHCR_USERNAME}/sqlite-meta-connector}"

SYFT_IMAGE="${SYFT_IMAGE:-anchore/syft:latest}"

build_and_push() {
  local name="$1"
  local dockerfile="$2"
  local context="$3"
  local tag_sha="${name}:sha-${SHA}"
  local tag_version="${name}:${VERSION}"

  echo "Building ${name} (${dockerfile})..."
  docker buildx build \
    --platform linux/amd64 \
    -f "${dockerfile}" \
    --build-arg BUILD_SHA="${SHA}" \
    --build-arg BUILD_VERSION="${VERSION}" \
    -t "${tag_sha}" \
    -t "${tag_version}" \
    --push \
    "${context}"

  echo "Generating SBOM for ${tag_version}..."
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "${ROOT_DIR}":"${ROOT_DIR}" \
    -w "${ROOT_DIR}" \
    "${SYFT_IMAGE}" "${tag_version}" -o spdx-json > "sbom-${name##*/}.json"

  echo "Signing ${tag_version}..."
  COSIGN_EXPERIMENTAL=1 cosign sign "${tag_version}"
  COSIGN_EXPERIMENTAL=1 cosign attest --type spdx --predicate "sbom-${name##*/}.json" "${tag_version}"
}

main() {
  echo "Publishing images to ${REGISTRY} as ${GHCR_USERNAME:-<unknown>}"
  build_and_push "${API_IMAGE}" "docker/api/Dockerfile" "${ROOT_DIR}"
  build_and_push "${CLI_IMAGE}" "docker/cli/Dockerfile" "${ROOT_DIR}"
  build_and_push "${CONNECTOR_IMAGE}" "docker/connector/Dockerfile" "${ROOT_DIR}"
  echo "Done. SBOM files saved to $(pwd)/sbom-*.json"
}

main "$@"
