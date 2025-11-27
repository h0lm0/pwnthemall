# Configuration

Cette page décrit toutes les variables d'environnement utilisées pour configurer votre CTF. Chaque variable peut être définie dans votre fichier `.env` à la racine du projet **pwnthemall**.

## Configuration de la base de données {#database}

### POSTGRES_USER {#postgres-user}
Nom d'utilisateur de la base de données PostgreSQL. Cet utilisateur sera créé et utilisé par l'application pour se connecter à la base de données.

**Par défaut :** `pwnthemall`

### POSTGRES_PASSWORD {#postgres-password}
Mot de passe pour l'utilisateur de la base de données PostgreSQL. Modifiez ceci avec un mot de passe robuste en environnement de production.

**Par défaut :** `pwnthemall`

### POSTGRES_DB {#postgres-db}
Nom de la base de données PostgreSQL qui sera créée et utilisée par la plateforme.

**Par défaut :** `pwnthemall-db`

### PTA_SEED_DATABASE {#pta-seed-database}
Contrôle si la base de données doit être initialisée avec des données initiales au démarrage.

**Valeurs :** `true` | `false`  
**Par défaut :** `true`

### PTA_SEED_CASBIN_CSV {#pta-seed-casbin-csv}
Détermine si les règles d'autorisation Casbin doivent être chargées depuis des fichiers CSV lors de l'initialisation de la base de données.

**Valeurs :** `true` | `false`  
**Par défaut :** `true`

### PTA_SEED_CASBIN {#pta-seed-casbin}
Active ou désactive l'initialisation des politiques Casbin. Lorsque désactivé, les règles d'autorisation doivent être configurées manuellement.

**Valeurs :** `true` | `false`  
**Par défaut :** `false`

## Configuration de l'application {#app-config}

### PTA_SITE_NAME {#pta-site-name}
Nom d'affichage de votre événement CTF. Ce nom apparaît dans toute l'interface de la plateforme.

**Par défaut :** `"pwnthemall"`

### PTA_PUBLIC_DOMAIN {#pta-public-domain}
Nom d'hôte sur lequel le reverse proxy Caddy écoutera les connexions entrantes. C'est le domaine public où les utilisateurs accéderont à votre CTF.

**Obligatoire :** Oui  
**Par défaut :** `"pwnthemall.local"`

### PTA_REGISTRATION_ENABLED {#pta-registration-enabled}
Contrôle si de nouveaux utilisateurs peuvent créer des comptes sur la plateforme.

**Valeurs :** `true` | `false`  
**Par défaut :** `true`

### PTA_CTF_START_TIME {#pta-ctf-start-time}
Horodatage marquant le début officiel de la compétition CTF. Les challenges peuvent être restreints avant cette heure.

**Format :** ISO 8601 datetime  
**Par défaut :** Vide (aucune restriction)

### PTA_CTF_END_TIME {#pta-ctf-end-time}
Horodatage marquant la fin de la compétition CTF. La plateforme peut restreindre les soumissions après cette heure.

**Format :** ISO 8601 datetime  
**Par défaut :** Vide (aucune restriction)

### PTA_DEMO {#pta-demo}
Active le mode démo pour les tests et présentations. Peut activer des fonctionnalités supplémentaires ou modifier le comportement à des fins de démonstration.

**Valeurs :** `true` | `false`  
**Par défaut :** `false`

### PTA_DEBUG_ENABLED {#pta-debug-enabled}
Active le mode débogage avec journalisation détaillée et messages d'erreur. Devrait être désactivé en production pour des raisons de sécurité et de performance.

**Valeurs :** `true` | `false`  
**Par défaut :** `false`

## Configuration du backend {#backend}

### JWT_SECRET {#jwt-secret}
Clé secrète utilisée pour signer les JSON Web Tokens pour l'authentification utilisateur. Doit être changée pour une valeur aléatoire sécurisée en production.

**Obligatoire :** Oui  
**Par défaut :** `d6r9h3UCI7qd6r9Js7ci2gFIZ2yym9`

### REFRESH_SECRET {#refresh-secret}
Clé secrète utilisée pour signer les tokens de rafraîchissement. Doit être changée pour une valeur aléatoire sécurisée en production.

**Obligatoire :** Oui  
**Par défaut :** `9Js7ci2gFIZ2yym9gXWAgYsFUCI7q`

## Configuration du frontend {#frontend}

### NEXT_PUBLIC_API_URL {#next-public-api-url}
URL publique où le frontend enverra les requêtes API. Devrait correspondre à votre domaine public avec le protocole HTTPS.

**Par défaut :** `"https://$PTA_PUBLIC_DOMAIN"`

## Configuration MinIO {#minio}

### MINIO_ROOT_USER {#minio-root-user}
Nom d'utilisateur root pour le stockage d'objets MinIO. Utilisé pour authentifier les opérations administratives.

**Par défaut :** `pwnthemall`

### MINIO_ROOT_PASSWORD {#minio-root-password}
Mot de passe root pour le stockage d'objets MinIO. Modifiez ceci avec un mot de passe robuste en production.

**Par défaut :** `vv7Eh3UCI7qd6r94C68sxgXWAgYsFHh3UCI7q`

### MINIO_DEFAULT_BUCKETS {#minio-default-buckets}
Liste séparée par des virgules des buckets de stockage à créer automatiquement au démarrage de MinIO.

**Par défaut :** `challenges`  
**NOTE IMPORTANTE :** Modifier cette valeur peut actuellement casser le processus de synchronisation des challenges. Veuillez conserver cette valeur.

### MINIO_NOTIFY_WEBHOOK_AUTH_TOKEN_DBSYNC {#minio-notify-webhook-auth-token-dbsync}
Token d'authentification pour les notifications webhook MinIO utilisées dans la synchronisation de base de données. Modifiez pour une valeur aléatoire sécurisée en production.

**Par défaut :** `QJs7ci2gFMG4C68sxh3UCI7qd6r9mtmvv7EmcMG4C6`

## Configuration Docker {#docker-config}

### PTA_DOCKER_WORKER_IP {#pta-docker-worker-ip}
Adresse IP ou nom d'hôte qui remplacera tous les paramètres fictifs `$ip` dans les champs connection_info des challenges. C'est l'adresse que les utilisateurs utiliseront pour se connecter à leurs instances de challenge.

**Par défaut :** `127.0.0.1`

### PTA_DOCKER_WORKER_URL {#pta-docker-worker-url}
URL de connexion au daemon Docker. Supporte les protocoles SSH (`ssh://`) et TCP (`tcp://`). Le backend utilise ceci pour gérer les conteneurs de challenges.

**Exemples :**
- `"ssh://docker@docker-worker"` (connexion SSH)
- `"/var/run/docker.sock"` (socket local)

**Par défaut :** `"ssh://docker@docker-worker"`

### PTA_DOCKER_IMAGE_PREFIX {#pta-docker-image-prefix}
Préfixe appliqué à toutes les images Docker construites pendant l'événement. Aide à organiser et identifier les images liées au CTF.

**Par défaut :** `"pta-"`

### PTA_DOCKER_MAXMEM_PER_INSTANCE {#pta-docker-maxmem-per-instance}
Allocation mémoire maximale par instance de conteneur Docker en mégaoctets. Empêche l'épuisement des ressources.

**Unité :** MB  
**Par défaut :** `256`

### PTA_DOCKER_MAXCPU_PER_INSTANCE {#pta-docker-maxcpu-per-instance}
Allocation CPU maximale par instance de conteneur Docker comme fraction décimale d'un cœur CPU.

**Exemple :** `0.01` = 1% d'un cœur CPU  
**Par défaut :** `0.01`

### PTA_DOCKER_INSTANCES_BY_USER {#pta-docker-instances-by-user}
Nombre maximum de conteneurs Docker concurrents qu'un utilisateur peut exécuter simultanément.

**Par défaut :** `5`

### PTA_DOCKER_INSTANCES_BY_TEAM {#pta-docker-instances-by-team}
Nombre maximum de conteneurs Docker concurrents qu'une équipe peut exécuter simultanément sur tous les membres.

**Par défaut :** `15`

### PTA_DOCKER_CHALL_BASE_CIDR {#pta-docker-chall-base-cidr}
Plage réseau CIDR de base utilisée pour la mise en réseau des conteneurs de challenges. Utilisé lorsque l'isolation réseau est activée.

**Statut :** BETA  
**Par défaut :** `"172.80.0.0/16"`

### PTA_DOCKER_INSTANCE_TIMEOUT {#pta-docker-instance-timeout}
Temps en minutes après lequel les conteneurs de challenges inactifs sont automatiquement arrêtés et supprimés.

**Unité :** Minutes  
**Par défaut :** `60`

### PTA_DOCKER_INSTANCE_COOLDOWN_SECONDS {#pta-docker-instance-cooldown-seconds}
Période de refroidissement de limitation de débit en secondes entre le lancement de nouvelles instances de conteneurs par utilisateur. Empêche les abus et l'épuisement des ressources.

**Unité :** Secondes  
**Par défaut :** `15`

### PTA_DOCKER_ISOLATION {#pta-docker-isolation}
Active l'isolation réseau entre les instances de challenges. Lorsqu'activé, chaque équipe ou utilisateur obtient un accès réseau isolé.

**Statut :** BETA  
**Valeurs :** `true` | `false`  
**Par défaut :** `false`

### PTA_DIND {#pta-dind}
Active le support Docker-in-Docker pour les challenges nécessitant une fonctionnalité de conteneurs imbriqués.

**Statut :** BETA  
**Valeurs :** `true` | `false`  
**Par défaut :** `false`

## Configuration des plugins {#plugins-config}

### PTA_PLUGINS_ENABLED {#pta-plugins-enabled}
Active le système de plugins pour étendre les fonctionnalités de la plateforme avec des modules personnalisés.

**Statut :** BETA  
**Valeurs :** `true` | `false`  
**Par défaut :** `false`

### PTA_PLUGIN_MAGIC_VALUE {#pta-plugin-magic-value}
Token d'authentification ou valeur magique utilisée par le système de plugins pour la vérification et la sécurité.

**Statut :** BETA  
**Par défaut :** `b551b87718b35cd13e81`

## Configuration des workers {#workers}

### DOCKER_WORKER_PASSWORD {#docker-worker-password}
Mot de passe SSH pour l'authentification au nœud worker Docker. Requis lors de l'utilisation de connexions Docker basées sur SSH.

**Obligatoire :** Oui  
**Par défaut :** `KAUifma4GIv9vtgVXXlDnpih5`

### LIBVIRT_WORKER_PASSWORD {#libvirt-worker-password}
Mot de passe pour l'authentification aux nœuds worker libvirt si des challenges basés sur des VM sont utilisés.

**Obligatoire :** Oui  
**Par défaut :** `K4zBjFFP3QScfs3VbDXAvqZ4cZY`

## Configuration Caddy {#caddy}

### CADDY_ENV {#caddy-env}
Préréglage d'environnement pour la configuration du reverse proxy Caddy. Détermine quel modèle Caddyfile utiliser.

**Obligatoire :** Oui  
**Par défaut :** `default`
