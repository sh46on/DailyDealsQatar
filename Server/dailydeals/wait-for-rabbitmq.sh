#!/bin/sh

host="rabbitmq"
port="5672"

echo "⏳ Waiting for RabbitMQ..."

while ! nc -z $host $port; do
  sleep 1
done

echo "✅ RabbitMQ is up!"

exec "$@"