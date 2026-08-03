#!/bin/bash
set -euo pipefail

SELF="$(realpath "$0")"
ROOT_DIR="$(dirname "$(dirname "${SELF}")")"
E2E_IMAGE=toybox-e2e

################################################################################
# SUBROUTINES
################################################################################

function docker_run() {
  docker run --rm --ipc=host --user "$(id -u):$(id -g)" \
    --env HOME=/tmp --env CI --volume "${ROOT_DIR}:/app" --workdir /app "${E2E_IMAGE}" "$@"
}

################################################################################
# SUBCOMMANDS
################################################################################

function cmd_help() { ## print help
  cat <<EOF
a tool to run playwright E2E testing.

Usage:
  $(basename "${SELF}") <command> [args...]

Command:
EOF

  sed -rn "s/^function cmd_([a-zA-Z_-]+)\(\)[ ]*[{][ ]*## (.*)[ ]*$/\1,\2/p" "${SELF}" |\
    awk 'BEGIN {FS = ","}; {printf "  %-20s %s\n", $1, $2}'
}

function cmd_build() { ## build docker image
  docker build -t "${E2E_IMAGE}" ./e2e
}

function cmd_run() { ## run playwright via docker
  cmd_build
  docker_run npm run e2e -- "$@"
}

################################################################################
# ENTRY POINT
################################################################################

cd "$ROOT_DIR"

SUBCMD="${1:-help}"
ALL_SUBCMD=$(sed -rn "s/^function cmd_([a-zA-Z_-]+)\(\)[ ]*[{].*$/\1/p" "${SELF}")
for value in $ALL_SUBCMD
do
  if [ "$value" = "$SUBCMD" ]; then
    "cmd_$SUBCMD" "${@:2}"
    exit 0;
  fi
done
echo "Invalid subcommand: ${SUBCMD}";
exit 1;
