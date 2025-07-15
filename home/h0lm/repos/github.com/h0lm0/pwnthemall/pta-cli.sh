#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="./.env"
if [[ -f "$ENV_FILE" ]]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Config file $ENV_FILE not found. MINIO_ROOT_USER/MINIO_ROOT_PASSWORD needed"
    exit 1
fi

MINIO_CONTAINER="minio"
MINIO_ALIAS="localminio"
MINIO_ENDPOINT="http://localhost:9000"
MOUNT_PATH="/data"


function minio_alias() {
    docker compose exec -it "$MINIO_CONTAINER" mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" 2>/dev/null || true
}

function minio_sync() {
    local folder="$1"
    local fullpath
    fullpath="$(realpath "$folder")"
    local bucket
    bucket="$(basename "$folder")"
    local container_path="$MOUNT_PATH/$bucket"

    echo "[+] Sync $folder → MinIO (bucket: $bucket)"

    docker compose exec -it "$MINIO_CONTAINER" mc mb --ignore-existing "$MINIO_ALIAS/$bucket"

    docker compose exec -it "$MINIO_CONTAINER" mc mirror --overwrite --remove "$container_path" "$MINIO_ALIAS/$bucket"

    echo "[✓] Sync successful"
}

# === DISPATCHER ===

function usage() {
    echo "Usage: $0 minio sync <folder>"
    exit 1
}

case "${1:-}" in
    minio)
        shift
        subcommand="${1:-}"
        shift || true

        case "$subcommand" in
            sync)
                folder="${1:-}"
                [ -z "$folder" ] && usage

                minio_alias
                minio_sync "$folder"
                ;;
            *)
                usage
                ;;
        esac
        ;;
    *)
        usage
        ;;
esac
