#!/bin/sh
echo "Host docker-worker
    IdentityFile /home/app/.ssh/docker-worker" > /home/app/.ssh/config
ssh-keyscan docker-worker
ssh-keyscan docker-worker > /home/app/.ssh/known_hosts
/app/pwnthemall