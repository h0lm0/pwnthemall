# Linux

## Prérequis

* Docker
* Docker Compose (>v2)
* Client SSH (commande `ssh-keygen`)
* Bash

NB : Actuellement, la seule option pour déployer le projet est d’utiliser Docker Compose.

## Étapes

```bash
# Cloner le projet
git clone https://github.com/h0lm0/pwnthemall.git
cd pwnthemall

# Créer le fichier .env et le modifier selon vos besoins
cp .env.example .env

# Lancer le tout !
bash pta-cli.sh compose up -b -e prod

# Ou si vous voulez exécuter l'environnement de développement
bash pta-cli.sh compose up -b -e dev
```

Par défaut, le proxy Caddy sera disponible sur `0.0.0.0:443`, mais comme il crée automatiquement un certificat SSL pour `pwnthemall.local`, vous pourriez rencontrer une erreur concernant le certificat SSL du site.
Pour corriger cela, vous pouvez simplement ajouter une entrée pour ce nom de domaine dans votre fichier `/etc/hosts` comme ceci :

```bash
127.0.0.1   pwnthemall.local
```

---

# Windows

## Prérequis

* Windows Subsystem for Linux (WSL)
* Ou, à défaut, Git Bash (si WSL n’est pas disponible)

## Étapes

Vous pouvez exécuter le projet de la même manière que sur Linux si vous utilisez directement le terminal WSL.

Utilisez le wrapper fourni `pta-cli.cmd`, qui détectera automatiquement WSL si disponible, ou basculera sur Git Bash sinon :

```shell
pta-cli.cmd compose up -b -e prod
pta-cli.cmd compose up -b -e dev
```
