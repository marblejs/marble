#!/bin/bash

RABBITMQ_CONTAINER=marble-rabbit

function wait_for_rabbit () {
  until docker exec $RABBITMQ_CONTAINER rabbitmqctl cluster_status > /dev/null 2>&1
  do
    sleep 2
    echo "Waiting for rabbitmq..."
  done
}

docker-compose -f docker-compose.yml up -d

wait_for_rabbit

if [ "$SCOPE" == "unit" ]; then
  jest --expand --coverage --detectOpenHandles
elif [ "$SCOPE" == "watch" ]; then
  jest --expand --onlyChanged --watch
else
  jest --expand --detectOpenHandles --runInBand
fi

docker-compose -f docker-compose.yml down
