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

# Worker  system needs: automatically retrieve docker gid 
DOCKER_GID=$(getent group docker | cut -d: -f3)
export DOCKER_GID

function minio_alias() {
    docker compose -f docker-compose.prod.yml exec -it "$MINIO_CONTAINER" mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" 2>/dev/null || true
}

function minio_sync() {
    local folder="$1"
    local fullpath
    fullpath="$(realpath "$folder")"
    local bucket
    bucket="$(basename "$folder")"
    local container_path="$MOUNT_PATH/$bucket"

    echo "[+] Sync $folder → MinIO (bucket: $bucket)"

    docker compose -f docker-compose.prod.yml exec -it "$MINIO_CONTAINER" mc mb --ignore-existing "$MINIO_ALIAS/$bucket"

    docker compose -f docker-compose.prod.yml exec -it "$MINIO_CONTAINER" mc mirror --overwrite --remove "$container_path" "$MINIO_ALIAS/$bucket"

    echo "[✓] Sync successful"
}

function compose_up() {
    local env="prod"
    local build="false"
    if [ ! -f ./shared/worker ]; then
        echo "WARN: Private key file shared/worker not found, generating new one..."
        generate_key
    fi
    while [[ $# -gt 0 ]]; do
        case "$1" in
            up)
                shift
                ;;
            -e|--env)
                env="$2"
                shift 2
                ;;
            -b|--build)
                build="true"
                shift
                ;;
            *)
                echo "[✗] Unknown option: $1"
                usage
                ;;
        esac
    done

    local compose_file="docker-compose.${env}.yml"

    if [[ ! -f "$compose_file" ]]; then
        echo "[✗] Compose file not found: $compose_file"
        exit 1
    fi

    echo "[+] Running docker compose using $compose_file"
    cmd=(docker compose -f "$compose_file" up -d)
    [[ "$build" == "true" ]] && cmd+=(--build)

    "${cmd[@]}"
    echo "[✓] Compose up completed"
}

function compose_down() {
    local env="prod"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            down)
                shift
                ;;
            -e|--env)
                env="$2"
                shift 2
                ;;
            *)
                echo "[✗] Unknown option: $1"
                usage
                ;;
        esac
    done

    local compose_file="docker-compose.${env}.yml"

    if [[ ! -f "$compose_file" ]]; then
        echo "[✗] Compose file not found: $compose_file"
        exit 1
    fi

    echo "[+] Stopping and removing containers using $compose_file"
    docker compose -f "$compose_file" down -v
    echo "[✓] Compose down completed"
}

function generate_key() {
    ssh-keygen -C '' -t ed25519 -N '' -f ./shared/worker
    chmod 400 ./shared/worker
}

function remove_key() {
    rm -rf ./shared/worker*
}

function usage() {
    echo "Usage:"
    echo "  $0 minio sync <folder>"
    echo "  $0 compose up [--build] [--env dev|prod]"
    echo "  $0 compose down [--env dev|prod]"
    echo "  $0 keys -g|gen"
    echo "  $0 keys -r|remove"
    exit 1
}

# === DISPATCHER ===

case "${1:-}" in
    minio)
        shift
        case "${1:-}" in
            sync)
                shift
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
    compose)
        shift
        case "${1:-}" in
            -u|up)
                compose_up "$@"
                ;;
            -d|down)
                compose_down "$@"
                ;;
            *)
                usage
                ;;
        esac
        ;;
    keys)
        shift
        case "${1:-}" in
            -g|gen)
                generate_key
                ;;
            -r|remove)
                remove_key
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
