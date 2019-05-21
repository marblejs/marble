#!/bin/bash

RABBITMQ_CONTAINER=marble-rabbit

function wait_for_rabbit () {
  until docker exec $RABBITMQ_CONTAINER rabbitmqctl cluster_status > /dev/null 2>&1
  do
    sleep 2
    echo "Waiting for rabbitmq..."
  done
}

docker-compose -f packages/@integration/docker-compose.yml up -d

wait_for_rabbit

jest --expand --detectOpenHandles --runInBand
docker-compose -f packages/@integration/docker-compose.yml down
