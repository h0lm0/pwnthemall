# Utilisation

Cette page explique comment utiliser pwnthemall, en commençant par la création de challenges.

## Création de Challenges

Tous les challenges doivent être placés dans le dossier suivant :

```
minio/challenges/[nom_du_challenge]
```

Dans `[nom_du_challenge]`, il doit obligatoirement y avoir un fichier nommé `chall.yml`.  
Ce fichier définit le challenge.

Des exemples de fichiers YAML se trouvent dans :

```
docs/challenges/
```

### Types de Challenges

1. **Standard**  
   - Un flag à trouver selon la description.  
   - Exemple : `docs/challenges/standard.chall.yml`

2. **Docker**  
   - Un flag à trouver avec un environnement conteneurisé dédié.  
   - Exemple : `docs/challenges/docker.chall.yml`

3. **Geo**  
   - Une localisation à pinner sur une map du monde selon les indices dans la description.  
   - Exemple : `docs/challenges/geo.chall.yml`

4. **Compose** *(WIP – pas encore terminé)*  
   - Un flag à trouver dans un environnement comprenant plusieurs conteneurs dédiés.  
   - Exemple : `docs/challenges/compose.chall.yml`
