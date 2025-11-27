#!/bin/sh
case "$PTA_DOCKER_WORKER_URL" in
    ssh://*)
        DOCKER_HOSTNAME=`echo "$PTA_DOCKER_WORKER_URL" | cut -d'@' -f2 | cut -d'/' -f1`
        echo "DOCKER_HOSTNAME: $DOCKER_HOSTNAME"
        echo "Host $DOCKER_HOSTNAME
            StrictHostKeyChecking no
            UserKnownHostsFile /dev/null
            IdentityFile /home/app/.ssh/$DOCKER_HOSTNAME" > /home/app/.ssh/config
        ;;
    *)
        echo "Docker Host is not ssh based; skipping"
        ;;
esac

if [ "$PTA_PLUGINS_ENABLED" = "true" ]; then
    echo "Host libvirt-worker
        StrictHostKeyChecking no
        UserKnownHostsFile /dev/null" >> /home/app/.ssh/config
fi
/app/pwnthemall