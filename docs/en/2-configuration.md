# Configuration

This page describes all environment variables used to configure your CTF. Each variable can be set in your `.env` file at the root of the **pwnthemall** project.

## Database configuration {#database}

### POSTGRES_USER {#postgres-user}
PostgreSQL database username. This user will be created and used by the application to connect to the database.

**Default:** `pwnthemall`

### POSTGRES_PASSWORD {#postgres-password}
Password for the PostgreSQL database user. Change this to a strong password in production environments.

**Default:** `pwnthemall`

### POSTGRES_DB {#postgres-db}
Name of the PostgreSQL database that will be created and used by the platform.

**Default:** `pwnthemall-db`

### PTA_SEED_DATABASE {#pta-seed-database}
Controls whether the database should be seeded with initial data on startup.

**Values:** `true` | `false`  
**Default:** `true`

### PTA_SEED_CASBIN_CSV {#pta-seed-casbin-csv}
Determines if Casbin authorization rules should be loaded from CSV files during database seeding.

**Values:** `true` | `false`  
**Default:** `true`

### PTA_SEED_CASBIN {#pta-seed-casbin}
Enables or disables Casbin policy seeding. When disabled, authorization rules must be configured manually.

**Values:** `true` | `false`  
**Default:** `false`

## Application configuration {#app-config}

### PTA_SITE_NAME {#pta-site-name}
Display name of your CTF event. This name appears throughout the platform interface.

**Default:** `"pwnthemall"`

### PTA_PUBLIC_DOMAIN {#pta-public-domain}
Hostname where the Caddy reverse proxy will listen for incoming connections. This is the public domain where users will access your CTF platform.

**Required:** Yes  
**Default:** `"pwnthemall.local"`

### PTA_REGISTRATION_ENABLED {#pta-registration-enabled}
Controls whether new users can register accounts on the platform.

**Values:** `true` | `false`  
**Default:** `true`

### PTA_CTF_START_TIME {#pta-ctf-start-time}
Timestamp marking the official start of the CTF competition. Challenges may be restricted before this time.

**Format:** ISO 8601 datetime  
**Default:** Empty (no restriction)

### PTA_CTF_END_TIME {#pta-ctf-end-time}
Timestamp marking the end of the CTF competition. The platform may restrict submissions after this time.

**Format:** ISO 8601 datetime  
**Default:** Empty (no restriction)

### PTA_DEMO {#pta-demo}
Enables demo mode for testing and presentations. May activate additional features or modify behavior for demonstration purposes.

**Values:** `true` | `false`  
**Default:** `false`

### PTA_DEBUG_ENABLED {#pta-debug-enabled}
Enables debug mode with verbose logging and error messages. Should be disabled in production for security and performance.

**Values:** `true` | `false`  
**Default:** `false`

## Backend configuration {#backend}

### JWT_SECRET {#jwt-secret}
Secret key used for signing JSON Web Tokens for user authentication. Must be changed to a secure random value in production.

**Required:** Yes  
**Default:** `d6r9h3UCI7qd6r9Js7ci2gFIZ2yym9`

### REFRESH_SECRET {#refresh-secret}
Secret key used for signing refresh tokens. Must be changed to a secure random value in production.

**Required:** Yes  
**Default:** `9Js7ci2gFIZ2yym9gXWAgYsFUCI7q`

## Frontend configuration {#frontend}

### NEXT_PUBLIC_API_URL {#next-public-api-url}
Public URL where the frontend will send API requests. Should match your public domain with HTTPS protocol.

**Default:** `"https://$PTA_PUBLIC_DOMAIN"`

## MinIO configuration {#minio}

### MINIO_ROOT_USER {#minio-root-user}
Root username for MinIO object storage. Used to authenticate administrative operations.

**Default:** `pwnthemall`

### MINIO_ROOT_PASSWORD {#minio-root-password}
Root password for MinIO object storage. Change this to a strong password in production.

**Default:** `vv7Eh3UCI7qd6r94C68sxgXWAgYsFHh3UCI7q`

### MINIO_DEFAULT_BUCKETS {#minio-default-buckets}
Comma-separated list of storage buckets to create automatically on MinIO startup.

**Default:** `challenges`  
**IMPORTANT NOTE:** Changing this value can currently break sync process of challenges. Please keep this value.

### MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC {#minio-notify-webhook-auth-token-dbsync}
Authentication token for MinIO webhook notifications used in database synchronization. Change to a secure random value in production.

**Default:** `QJs7ci2gFMG4C68sxh3UCI7qd6r9mtmvv7EmcMG4C6`

## Docker configuration {#docker-config}

### PTA_DOCKER_WORKER_IP {#pta-docker-worker-ip}
IP address or hostname that will replace all `$ip` placeholders in challenge connection_info fields. This is the address users will use to connect to their challenge instances.

**Default:** `127.0.0.1`

### PTA_DOCKER_WORKER_URL {#pta-docker-worker-url}
Docker daemon connection URL. Supports SSH (`ssh://`) and TCP protocols. The backend uses this to manage challenge containers.

**Examples:**
- `"ssh://docker@docker-worker"` (SSH connection)
- `"/var/run/docker.sock"` (Local socket)

**Default:** `"ssh://docker@docker-worker"`

### PTA_DOCKER_IMAGE_PREFIX {#pta-docker-image-prefix}
Prefix applied to all Docker images built during the event. Helps organize and identify CTF-related images.

**Default:** `"pta-"`

### PTA_DOCKER_MAXMEM_PER_INSTANCE {#pta-docker-maxmem-per-instance}
Maximum memory allocation per Docker container instance in megabytes. Prevents resource exhaustion.

**Unit:** MB  
**Default:** `256`

### PTA_DOCKER_MAXCPU_PER_INSTANCE {#pta-docker-maxcpu-per-instance}
Maximum CPU allocation per Docker container instance as a decimal fraction of one CPU core.

**Example:** `0.01` = 1% of one CPU core  
**Default:** `0.01`

### PTA_DOCKER_INSTANCES_BY_USER {#pta-docker-instances-by-user}
Maximum number of concurrent Docker containers a single user can run simultaneously.

**Default:** `5`

### PTA_DOCKER_INSTANCES_BY_TEAM {#pta-docker-instances-by-team}
Maximum number of concurrent Docker containers a team can run simultaneously across all members.

**Default:** `15`

### PTA_DOCKER_CHALL_BASE_CIDR {#pta-docker-chall-base-cidr}
Base CIDR network range used for challenge container networking. Used when network isolation is enabled.

**Status:** BETA  
**Default:** `"172.80.0.0/16"`

### PTA_DOCKER_INSTANCE_TIMEOUT {#pta-docker-instance-timeout}
Time in minutes after which idle challenge containers are automatically stopped and removed.

**Unit:** Minutes  
**Default:** `60`

### PTA_DOCKER_INSTANCE_COOLDOWN_SECONDS {#pta-docker-instance-cooldown-seconds}
Rate limit cooldown period in seconds between launching new container instances per user. Prevents abuse and resource exhaustion.

**Unit:** Seconds  
**Default:** `15`

### PTA_DOCKER_ISOLATION {#pta-docker-isolation}
Enables network isolation between challenge instances. When enabled, each team or user gets isolated network access.

**Status:** BETA  
**Values:** `true` | `false`  
**Default:** `false`

### PTA_DIND {#pta-dind}
Enables Docker-in-Docker support for challenges that require nested container functionality.

**Status:** BETA  
**Values:** `true` | `false`  
**Default:** `false`

## Plugins configuration {#plugins-config}

### PTA_PLUGINS_ENABLED {#pta-plugins-enabled}
Enables the plugin system for extending platform functionality with custom modules.

**Status:** BETA  
**Values:** `true` | `false`  
**Default:** `false`

### PTA_PLUGIN_MAGIC_VALUE {#pta-plugin-magic-value}
Authentication token or magic value used by the plugin system for verification and security.

**Status:** BETA  
**Default:** `b551b87718b35cd13e81`

## Workers configuration {#workers}

### DOCKER_WORKER_PASSWORD {#docker-worker-password}
SSH password for authenticating to the Docker worker node. Required when using SSH-based Docker connections.

**Required:** Yes  
**Default:** `KAUifma4GIv9vtgVXXlDnpih5`

### LIBVIRT_WORKER_PASSWORD {#libvirt-worker-password}
Password for authenticating to libvirt worker nodes if VM-based challenges are used.

**Required:** Yes  
**Default:** `K4zBjFFP3QScfs3VbDXAvqZ4cZY`

## Caddy configuration {#caddy}

### CADDY_ENV {#caddy-env}
Environment preset for Caddy reverse proxy configuration. Determines which Caddyfile template to use.

**Required:** Yes  
**Default:** `default`
