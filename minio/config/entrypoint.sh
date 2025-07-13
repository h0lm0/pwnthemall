#!/bin/bash
minio server /data/minio --console-address ":9001" &
sleep 5
mc alias set local http://127.0.0.1:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
mc mb --ignore-existing local/challenges
CHECK=$(mc event list local/challenges arn:minio:sqs::DBSYNC:webhook)
if [[ -z $CHECK ]]; then
    mc event add local/challenges  arn:minio:sqs::DBSYNC:webhook --suffix '.yml'
fi
tail -f /dev/null