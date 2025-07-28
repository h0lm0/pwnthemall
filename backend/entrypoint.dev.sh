#!/bin/sh
echo "Host worker
    IdentityFile /home/app/.ssh/worker" > /home/app/.ssh/config
ssh-keyscan worker
ssh-keyscan worker > /home/app/.ssh/known_hosts
air