#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="./.env"
if [[ -f "$ENV_FILE" ]]; then
    sed -i 's/\r$//' "$ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Config file $ENV_FILE not found. MINIO_ROOT_USER/MINIO_ROOT_PASSWORD needed"
    exit 1
fi

if ! jq --help &>/dev/null; then
    echo "The jq package is required to run the script. Please install it before running again the script."
    exit 1
fi

MINIO_CONTAINER="minio"
MINIO_ALIAS="localminio"
MINIO_ENDPOINT="http://localhost:9000"
MOUNT_PATH="/data"

# Worker  system needs: automatically retrieve docker gid 
DOCKER_GID=$(getent group docker | cut -d: -f3)
export DOCKER_GID

# Global flags
VERBOSE="false"

function log_info() {
    echo "$1"
}

function log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        >&2 echo "$1"
    fi
}

# Parse global flags (-v/--verbose) before dispatching subcommands
while [[ ${1:-} =~ ^--?v(erbose)?$ ]]; do
    VERBOSE="true"
    shift || true
done

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

function env_randomize() {
    local env_file="$ENV_FILE"
    if [[ ! -f "$env_file" ]]; then
        echo "[✗] .env file not found: $env_file"
        exit 1
    fi

    echo "[+] Randomizing sensitive values in $env_file"

    rand_str() {
        local length="$1"
        tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$length"
    }

    sed -i \
        -e "s|^\(POSTGRES_PASSWORD=\).*|\1$(rand_str 20)|" \
        -e "s|^\(JWT_SECRET=\).*|\1$(rand_str 30)|" \
        -e "s|^\(REFRESH_SECRET=\).*|\1$(rand_str 30)|" \
        -e "s|^\(MINIO_ROOT_PASSWORD=\).*|\1$(rand_str 40)|" \
        -e "s|^\(MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC=\).*|\1$(rand_str 40)|" \
        -e "s|^\(WORKER_PASSWORD=\).*|\1$(rand_str 25)|" \
        "$env_file"

    echo "[✓] Randomization complete"
}

function compose_up() {
    local env="prod"
    local build="false"
    local follow_logs="false"

    if [ ! -f ./shared/worker ]; then
        echo "WARN: Private key file shared/worker not found, generating new one..."
        generate_key
    fi

    while [[ $# -gt 0 ]]; do
        case "$1" in
            up|-u)
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
            -l|--logs|--follow-logs)
                follow_logs="true"
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

    echo "[+] Starting services..."
    [[ "$VERBOSE" == "true" ]] && echo "    env=$env compose_file=$compose_file build=$build follow_logs=$follow_logs"

    # Redirect both stdout and stderr to a log file, then display only if error
    local log_file
    log_file=$(mktemp)

    if [[ "$VERBOSE" == "true" ]]; then
        # In verbose mode, stream output directly
        if [[ "$build" == "true" ]]; then
            log_debug "+ docker compose -f $compose_file up -d --build"
            docker compose -f "$compose_file" up -d --build | sed 's/^/[compose] /'
        else
            log_debug "+ docker compose -f $compose_file up -d"
            docker compose -f "$compose_file" up -d | sed 's/^/[compose] /'
        fi
    else
        if [[ "$build" == "true" ]]; then
            docker compose -f "$compose_file" up -d --build >"$log_file" 2>&1
        else
            docker compose -f "$compose_file" up -d >"$log_file" 2>&1
        fi
    fi

    local status=$?

    if [[ $status -ne 0 ]]; then
        echo "[✗] Failed to start services:"
        if [[ -f "$log_file" ]]; then
            cat "$log_file"
        else
            echo "(no log file captured)"
        fi
        rm -f "$log_file"
        exit 1
    fi

    rm -f "$log_file" 2>/dev/null || true

    echo "[+] Waiting for services to initialize"
    sleep 5

    if [[ "$VERBOSE" == "true" ]]; then
        echo "[+] Current service status:"
        log_debug "+ docker compose -f $compose_file ps"
        docker compose -f "$compose_file" ps
        echo
        echo "[+] Recent logs (last 100 lines per service):"
        log_debug "+ docker compose -f $compose_file logs --tail=100"
        docker compose -f "$compose_file" logs --tail=100 || true
    fi

    if [[ "$follow_logs" == "true" ]]; then
        echo "[+] Following logs (Ctrl-C to stop)..."
        log_debug "+ docker compose -f $compose_file logs -f --tail=100"
        docker compose -f "$compose_file" logs -f --tail=100 || true
    fi

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

    echo "[+] Cleaning up challenge instances..."
    
    # Get all containers with pta- prefix (challenge containers)
    local challenge_containers
    challenge_containers=$(docker ps -aq --filter "name=pta-" 2>/dev/null || true)
    
    if [[ -n "$challenge_containers" ]]; then
        echo "[+] Found challenge containers, stopping and removing them..."
        # Force remove all challenge containers (stop + remove in one command)
        [[ "$VERBOSE" == "true" ]] && echo "$challenge_containers"
        echo "$challenge_containers" | xargs docker rm -f 2>/dev/null || true
        echo "[✓] Challenge containers cleaned up"
    else
        echo "[✓] No challenge containers to clean up"
    fi

    echo "[+] Stopping and removing containers using $compose_file"
    [[ "$VERBOSE" == "true" ]] && docker compose -f "$compose_file" ps || true
    [[ "$VERBOSE" == "true" ]] && echo "+ docker compose -f $compose_file down -v"
    docker compose -f "$compose_file" down -v
    echo "[✓] Compose down completed"
}

function generate_key() {
    mkdir -p ./shared
    ssh-keygen -C '' -t ed25519 -N '' -f ./shared/worker
    chmod 400 ./shared/worker
}

function remove_key() {
    rm -rf ./shared/worker*
}

function usage() {
    echo "Usage:"
    echo "  $0 [-v|--verbose] minio sync <folder>"
    echo "  $0 [-v|--verbose] compose up [--build] [--env dev|prod] [-l|--logs]"
    echo "  $0 [-v|--verbose] compose down [--env dev|prod]"
    echo "  $0 keys -g|gen"
    echo "  $0 keys -r|remove"
    echo "  $0 env randomize"
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
    env)
        shift
        case "${1:-}" in
            randomize)
                env_randomize
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
