#!/bin/sh

if [ "$SERVICE_TYPE" = "migrations" ]; then
    yarn migrate:up
elif [ "$SERVICE_TYPE" = "cron" ]; then
    echo "0 */12 * * * cd /app && node dist/index.js >> /var/log/cron.log 2>&1" | crontab -
    crond -f -l 8
else
    node dist/index.js
fi 