#!/bin/bash

RABBITMQ_CONTAINER=marble-rabbit

docker-compose -f docker-compose.yml up -d

node scripts/wait-rabbitmq.js
node scripts/wait-redis.js

if [ "$SCOPE" == "unit" ]; then
  jest --expand --coverage --detectOpenHandles
elif [ "$SCOPE" == "watch" ]; then
  jest --expand --onlyChanged --watch
else
  jest --expand --detectOpenHandles --runInBand
fi

if [ $? -ne 0 ]; then
  exit 1
fi

docker-compose -f docker-compose.yml down
