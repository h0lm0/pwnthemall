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

MINIO_CONTAINER="minio"
MINIO_ALIAS="localminio"
MINIO_ENDPOINT="http://localhost:9000"
MOUNT_PATH="/data"

# Worker  system needs: automatically retrieve docker gid 
DOCKER_GID=$(getent group docker | cut -d: -f3)
export DOCKER_GID

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

function print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

function print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

function print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

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
    local secure="false"
    
    if [ ! -f ./shared/worker ]; then
        echo "WARN: Private key file shared/worker not found, use --secure flag to generate keys"
        exit 1
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
            -s|--secure)
                secure="true"
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

    if [[ "$secure" == "true" ]]; then
        print_info "Setting up Docker-in-Docker security..."
        setup_secure_internal
        print_info "Starting PwnThemAll with Docker-in-Docker security"
        print_info "Challenge containers will run in isolated environment"
    else
        print_warning "Starting PwnThemAll with direct Docker socket access"
        print_warning "Consider using --secure flag for better security"
    fi

    echo "[+] Running docker compose using $compose_file"
    cmd=(docker compose -f "$compose_file" up -d)
    [[ "$build" == "true" ]] && cmd+=(--build)

    "${cmd[@]}"
    echo "[✓] Compose up completed"
    
    if [[ "$secure" == "true" ]]; then
        print_status "Docker-in-Docker security enabled"
        print_info "Challenge containers are isolated from host system"
    fi
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



function check_container_status() {
    local container_name=$1
    local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not_found")
    
    case $status in
        "running")
            print_status "$container_name: Running"
            ;;
        "exited")
            print_error "$container_name: Exited"
            ;;
        "created")
            print_warning "$container_name: Created but not started"
            ;;
        "not_found")
            print_error "$container_name: Not found"
            ;;
        *)
            print_warning "$container_name: $status"
            ;;
    esac
}

function show_comprehensive_info() {
    echo ""
    print_info "PwnThemAll System Information:"
    echo "================================="
    
    # Container Status
    echo ""
    print_info "Container Status:"
    echo "-------------------"
    check_container_status "frontend"
    check_container_status "backend"
    check_container_status "worker"
    check_container_status "db"
    check_container_status "caddy"
    check_container_status "minio"
    check_container_status "pwnthemall-docker-daemon"
    
    # Application URLs
    echo ""
    print_info "Application URLs:"
    echo "-------------------"
    echo "Frontend: http://localhost:8080"
    echo "Backend API: http://localhost:8080/api"
    echo "MinIO Console: http://localhost:9001 (localhost only)"
    
    # Security Status
    echo ""
    print_info "Security Status:"
    echo "------------------"
    
    # Check if DinD container is running
    if docker ps --format "table {{.Names}}" | grep -q "pwnthemall-docker-daemon"; then
        print_status "Docker-in-Docker container is running"
        
        # Check if worker can access host Docker socket
        if docker exec worker ls /var/run/docker.sock &>/dev/null; then
            print_error "WARNING: Worker still has access to host Docker socket"
        else
            print_status "Worker does not have access to host Docker socket"
        fi
        
        # Check if DinD is using TLS
        if docker exec worker env | grep -q "DOCKER_TLS_VERIFY=1"; then
            print_status "Docker-in-Docker is using TLS encryption"
        else
            print_warning "Docker-in-Docker is using non-TLS connection (less secure)"
        fi
    else
        print_warning "Docker-in-Docker container is not running"
        print_warning "Application may be using direct Docker socket access"
    fi
    
    # Challenge Containers
    echo ""
    print_info "Challenge Containers:"
    echo "----------------------"
    
    # Try to list containers in DinD first
    if docker ps | grep -q "pwnthemall-docker-daemon"; then
        local dind_containers=$(docker exec pwnthemall-docker-daemon docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null)
        if echo "$dind_containers" | grep -q "NAMES"; then
            echo "$dind_containers"
            local container_count=$(echo "$dind_containers" | wc -l)
            if [ $container_count -eq 1 ]; then
                print_warning "No challenge containers running in DinD"
            else
                print_status "Challenge containers (in DinD) listed successfully"
            fi
        else
            print_warning "No challenge containers running in DinD"
        fi
    else
        # Fallback to host Docker
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(pta-|challenge)" || print_warning "No challenge containers running"
    fi
}



function monitor_realtime() {
    echo ""
    print_info "Starting real-time monitoring (Ctrl+C to stop):"
    echo "--------------------------------------------------"
    
    # Check if we're using DinD setup
    if docker ps | grep -q "pwnthemall-docker-daemon"; then
        print_info "Detected Docker-in-Docker setup - monitoring DinD containers"
        
        # Show current state from DinD
        echo ""
        print_info "Current DinD container status:"
        local dind_containers=$(docker exec pwnthemall-docker-daemon docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null)
        if echo "$dind_containers" | grep -q "NAMES"; then
            echo "$dind_containers"
            local container_count=$(echo "$dind_containers" | wc -l)
            if [ $container_count -eq 1 ]; then
                print_warning "No challenge containers currently running in DinD"
            fi
        else
            print_warning "No challenge containers currently running in DinD"
        fi
        
        echo ""
        print_info "Monitoring Docker events (create/start/stop/die)..."
        print_info "Try starting/stopping a challenge instance to see events"
        echo ""
        printf "%-19s %-8s %s\n" "DATE TIME (DD/MM)" "ACTION" "CONTAINER"
        printf "%-19s %-8s %s\n" "--------------" "------" "---------"
        
        # Monitor Docker events from DinD with human-readable time
        docker exec pwnthemall-docker-daemon docker events --filter 'type=container' --filter 'event=create' --filter 'event=start' --filter 'event=stop' --filter 'event=die' --format '{{.Time}} {{.Action}} {{.Actor.Attributes.name}}' | while read -r timestamp action container; do
            # Convert timestamp to human readable format
            if [[ "$timestamp" =~ ^[0-9]+$ ]]; then
                # Unix timestamp - convert to readable format (DD/MM format)
                human_time=$(date -d "@$timestamp" '+%d/%m %H:%M:%S' 2>/dev/null || date -r "$timestamp" '+%d/%m %H:%M:%S' 2>/dev/null || echo "$timestamp")
            else
                # Already in ISO format - extract date and time (DD/MM format)
                human_time=$(echo "$timestamp" | sed 's/.*\([0-9-]*\)T\([0-9:]*\).*/\1 \2/' | sed 's/\([0-9]*\)-\([0-9]*\)-\([0-9]*\) \([0-9:]*\)/\3\/\2 \4/' | cut -d: -f1-3)
            fi
            printf "%-19s %-8s %s\n" "$human_time" "$action" "$container"
        done
    else
        print_info "Using host Docker - monitoring host containers"
        
        # Show current state from host
        echo ""
        print_info "Current host container status:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -1
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -v "NAMES"
        
        echo ""
        print_info "Monitoring Docker events (create/start/stop/die)..."
        print_info "Try starting/stopping a challenge instance to see events"
        echo ""
        printf "%-19s %-8s %s\n" "DATE TIME (DD/MM)" "ACTION" "CONTAINER"
        printf "%-19s %-8s %s\n" "--------------" "------" "---------"
        
        # Monitor Docker events from host with human-readable time
        docker events --filter 'type=container' --filter 'event=create' --filter 'event=start' --filter 'event=stop' --filter 'event=die' --format '{{.Time}} {{.Action}} {{.Actor.Attributes.name}}' | while read -r timestamp action container; do
            # Convert timestamp to human readable format
            if [[ "$timestamp" =~ ^[0-9]+$ ]]; then
                # Unix timestamp - convert to readable format (DD/MM format)
                human_time=$(date -d "@$timestamp" '+%d/%m %H:%M:%S' 2>/dev/null || date -r "$timestamp" '+%d/%m %H:%M:%S' 2>/dev/null || echo "$timestamp")
            else
                # Already in ISO format - extract date and time (DD/MM format)
                human_time=$(echo "$timestamp" | sed 's/.*\([0-9-]*\)T\([0-9:]*\).*/\1 \2/' | sed 's/\([0-9]*\)-\([0-9]*\)-\([0-9]*\) \([0-9:]*\)/\3\/\2 \4/' | cut -d: -f1-3)
            fi
            printf "%-19s %-8s %s\n" "$human_time" "$action" "$container"
        done
    fi
}

function setup_secure_internal() {
    # Generate secure secrets if not set
    if [[ -f .env ]]; then
        source .env
    fi
    
    # Regenerate SSH keys for security (fresh keys for secure setup)
    print_info "Regenerating SSH keys for secure setup..."
    rm -rf ./shared/worker*
    ssh-keygen -C '' -t ed25519 -N '' -f ./shared/worker
    chmod 400 ./shared/worker
    print_status "Generated fresh SSH keys"
    
    # Generate JWT secrets if not set
    if [[ "${JWT_SECRET:-}" == "your_jwt_secret_here" ]] || [[ -z "${JWT_SECRET:-}" ]]; then
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        print_status "Generated JWT_SECRET"
    fi
    
    if [[ "${REFRESH_SECRET:-}" == "your_refresh_secret_here" ]] || [[ -z "${REFRESH_SECRET:-}" ]]; then
        REFRESH_SECRET=$(openssl rand -hex 32)
        sed -i "s/REFRESH_SECRET=.*/REFRESH_SECRET=$REFRESH_SECRET/" .env
        print_status "Generated REFRESH_SECRET"
    fi
    
    # Generate webhook token if not set
    if [[ "${MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC:-}" == "your_webhook_token_here" ]] || [[ -z "${MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC:-}" ]]; then
        MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC=$(openssl rand -hex 16)
        sed -i "s/MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC=.*/MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC=$MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC/" .env
        print_status "Generated MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC"
    fi
    
    # Update DOCKER_GID
    DOCKER_GID=$(getent group docker | cut -d: -f3)
    sed -i "s/DOCKER_GID=.*/DOCKER_GID=$DOCKER_GID/" .env
    print_status "Updated DOCKER_GID to $DOCKER_GID"
    
    print_status "Security setup completed"
}

function usage() {
    echo "Usage:"
    echo "  $0 minio sync <folder>"
    echo "  $0 compose up [--build] [--env dev|prod] [--secure]"
    echo "  $0 compose down [--env dev|prod]"
    echo ""
    echo "Security Options:"
    echo "  --secure    Use Docker-in-Docker for better security (auto-setup included)"
    echo "              Automatically generates SSH keys for enhanced security"
    echo ""
    echo "Info Commands:"
    echo "  info        Show comprehensive system status (containers, security, challenges)"
    echo "  monitor     Real-time Docker events monitoring (advanced)"
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

    info)
        show_comprehensive_info
        ;;
    monitor)
        monitor_realtime
        ;;
    *)
        usage
        ;;
esac
