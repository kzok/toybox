#!/bin/bash
set -euo pipefail

# check playwright version between npm package and image.

if [ ! -f ./e2e/Dockerfile ] || [ ! -x ./node_modules/.bin/playwright ]; then
  echo "entrypoint.sh: run this image with the repository root (after npm ci) mounted as the working directory." >&2
  exit 1
fi

image_version="$(sed -n 's|^FROM mcr.microsoft.com/playwright:v\([^-]*\)-.*$|\1|p' ./e2e/Dockerfile)"
npm_version="$(./node_modules/.bin/playwright --version | sed 's/^Version //')"

if [ "$npm_version" != "$image_version" ]; then
  echo "@playwright/test is $npm_version but e2e/Dockerfile pins $image_version. Please sync them." >&2
  exit 1
fi

exec "$@"
