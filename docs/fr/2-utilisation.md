# Utilisation

Cette page explique comment utiliser pwnthemall, en commençant par la création de challenges.

## Création de Challenges

Tous les challenges doivent être placés dans le dossier suivant :

```
minio/challenges/[nom_du_challenge]
```

Dans `[nom_du_challenge]`, il doit obligatoirement y avoir un fichier nommé `chall.yml`.  
Ce fichier définit le challenge.

Les structures des fichiers YAML se trouvent dans [docs/challenges/](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges)

### Types de Challenges

1. **Standard**  
   - Un flag à trouver selon la description.  
   - Exemple : [docs/challenges/standard.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 01"
      description: |
         Standard challenge example

         Make a team and enter the flag "PwnThatDemo" to solve it !
      category: "pwn"
      difficulty: "easy"
      type: "standard"
      author: "Kevin'MIT"
      hidden: false
      flags: ["PwnThatDemo"]
      points: 123
      ```

2. **Docker**  
   - Un flag à trouver avec un environnement conteneurisé dédié.  
   - Exemple : [docs/challenges/docker.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 02 (Docker)"
      description: |
         Simple challenge using Docker container.

         The flag is "whatsthis?aDockerContainer!"
      category: web
      difficulty: easy
      type: docker
      author: "Kevin'MITDocker"
      flags: ["whatsthis?aDockerContainer!"]
      hidden: false
      points: 500
      ports: [5001]
      connection_info: ["http://$ip:5001"] 
      ```

3. **Geo**  
   - Une localisation à pinner sur une map du monde selon les indices dans la description.  
   - Exemple : [docs/challenges/geo.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 03 (Geo)"
      description: |
         This challenge is a 'geo' challenge. The goal is to find a location on the earth's map.

         Place your pin at the correct location (Eiffel Tower)
      category: misc
      difficulty: easy
      type: geo
      author: "Kevin'MITGeo"
      hidden: false
      flags: []
      points: 200
      target_lat: 48.85837
      target_lng: 2.294481
      radius_km: 1.0
      ```

4. **Compose** 
   - Un flag à trouver dans un environnement comprenant plusieurs conteneurs dédiés.  
   - Exemple : [docs/challenges/compose.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 04 (Compose - WIP)"
      description: |
         Compose challenge example

         Enter the flag "really?ComposeChallenges!" to solve it !
      category: "pwn"
      difficulty: "easy"
      type: "compose"
      author: "h0lm0"
      hidden: false
      flags: ["really?ComposeChallenges!"]
      points: 123
      ports: [80,22]
      connection_info: ["http://$ip:[80]", "ssh -p [22] guest@$ip"]
      ```

## Synchronisation des challenges

La synchronisation des challenges se fait via le script `pta-cli.sh`. Une fois vos YAML créés et modifiés, vous pouvez lancer la synchronisation des challeges vers le stockage MinIO avec la commande:

```bash
bash pta-cli.sh minio sync challenges
```

![sync-vhs](../assets/minio-sync.gif)
