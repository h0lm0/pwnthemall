#!/bin/bash
/entrypoint.sh mysqld & 
if [[ $? -ne 0 ]]; then
    echo "mysqld failed to start"
    exit 1
fi

while ! mysqladmin ping -h"127.0.0.1" --silent; do
    echo "Waiting for db to be ready..."
    sleep 1
done

exec python3 /app/challenge.py
