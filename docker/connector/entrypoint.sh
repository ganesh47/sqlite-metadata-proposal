#!/usr/bin/env bash
set -euo pipefail

JAVA_OPTS="${JAVA_OPTS:-}"

exec java ${JAVA_OPTS} -jar /srv/connector/app.jar
