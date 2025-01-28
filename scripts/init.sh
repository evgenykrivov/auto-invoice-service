#!/bin/sh

# Ждем, пока база данных будет готова
echo "Waiting for postgres..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Запускаем миграции
yarn migrate:up

# Запускаем основное приложение
yarn start 