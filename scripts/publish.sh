#!/usr/bin/env bash

cp README.md ./packages/core
lerna publish
rm -rf ./packages/core/README.md
