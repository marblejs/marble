#!/usr/bin/env bash

cp README.md ./packages/core
cp README.md ./packages/middleware-body
cp README.md ./packages/middleware-logger
lerna publish
rm -rf ./packages/core/README.md
rm -rf ./packages/middleware-body/README.md
rm -rf ./packages/middleware-logger/README.md
