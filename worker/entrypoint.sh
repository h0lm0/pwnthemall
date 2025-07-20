#!/bin/bash
ssh-keygen -A

# chmod 755 /home/docker/.ssh/authorized_keys

exec /usr/sbin/sshd -D -e "$@"