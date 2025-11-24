#!/bin/sh
set -e

ssh-keygen -A

dockerd-entrypoint.sh &

echo "Waiting for Docker daemon to be ready..."
until docker info >/dev/null 2>&1; do
    sleep 1
done
echo "Docker daemon is up."

exec /usr/sbin/sshd -D -e "$@"
