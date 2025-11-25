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
      decay: "Logarithmic - Medium"
      author: "Kevin'MIT"
      hidden: false
      flags: ["flag"]
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
      decay: "Logarithmic - Medium"
      author: "Kevin'MITDocker"
      flags: ["flag"]
      hidden: false
      points: 500
      ports: [5001]
      connection_info: ["http://$ip:[5001]"] 
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
      decay: "Logarithmic - Medium"
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
      name: "Demo 04 (Compose)"
      description: |
         Compose challenge example

         Enter the flag "really?ComposeChallenges!" to solve it !
      category: "pwn"
      difficulty: "easy"
      type: "compose"
      decay: "Logarithmic - Medium"
      author: "h0lm0"
      hidden: false
      flags: ["flag"]
      points: 123
      ports: [80,22]
      connection_info: ["http://$ip:[80]", "ssh -p [22] guest@$ip"]
      ```

## Dépendances entre Challenges

Le champ `depends_on` est **optionnel** et permet de créer des chaînes de challenges en exigeant que les équipes résolvent un challenge avant d'accéder à un autre.

### Fonctionnement

- Les challenges sont **masqués** pour les équipes jusqu'à ce que la dépendance soit résolue
- Une fois le challenge requis résolu, le challenge dépendant apparaît dans la liste
- Les admin peuvent toujours voir et accéder à tous les challenges indépendamment des dépendances

### Utilisation

```yaml
depends_on: "Nom du Challenge"  # Nom exact du challenge qui doit être résolu en premier
```

### Exemple : Chaîne de Challenges Progressive

```yaml
# Challenge 1
name: "L'histoire du maire [1/3]"
category: osint
difficulty: easy
points: 100
flags: ["flag1"]
# Pas de depends_on - c'est le premier challenge
```

```yaml
# Challenge 2 : Trouver le nom du fils du maire (nécessite Challenge 1)
name: "L'histoire du maire [2/3]"
category: osint
difficulty: medium
points: 200
flags: ["flag2"]
depends_on: "L'histoire du maire [1/3]"  
```

```yaml
# Challenge 3 : Trouver le secret de famille (nécessite Challenge 2)
name: "L'histoire du maire [3/3]"
category: osint
difficulty: hard
points: 300
flags: ["flag3"]
depends_on: "L'histoire du maire [2/3]" 
```

Cela crée une chaîne : **Challenge 1** → **Challenge 2** → **Challenge 3**

## Système de Decay

Le champ `decay` est **optionnel** et contrôle comment les points d'un challenge diminuent au fur et à mesure que les équipes le résolvent. S'il n'est pas spécifié, le challenge n'aura **aucun decay** (points fixes).

### Formules de decay disponibles

- **No Decay** - Les points restent constants peu importe le nombre de résolutions
- **Logarithmic - Ultra Slow** - decay très minimale (step: 10, min: 10 pts)
- **Logarithmic - Very Slow** - decay lente (step: 25, min: 25 pts)
- **Logarithmic - Slow** - decay modérément lente (step: 50, min: 100 pts)
- **Logarithmic - Medium** - decay équilibrée (step: 75, min: 75 pts)
- **Logarithmic - Fast** - decay agressive (step: 100, min: 50 pts)

### Fonctionnement

La decay logarithmique utilise la formule : `points = pointsDeBase - (step × log₂(numéroRésolution))`

- La **première résolution** reçoit toujours les points complets (pas de decay)
- Les points diminuent rapidement pour les premières résolutions, puis ralentissent
- Les points ne descendent jamais en dessous du minimum spécifié

Exemple avec 500 points de base et "Logarithmic - Medium" (step: 75, min: 75) :
- 1ère résolution : 500 pts
- 2ème résolution : 425 pts (500 - 75×1)
- 3ème résolution : 381 pts (500 - 75×1.58)
- 5ème résolution : 326 pts (500 - 75×2.32)
- 10ème résolution : 251 pts (500 - 75×3.32)
- 20ème résolution : 176 pts (500 - 75×4.32)
- 50ème+ résolution : 75 pts (minimum)

### Utilisation

```yaml
# Avec decay
decay: "Logarithmic - Medium"

# Sans decay (par défaut si omis)
# Pas besoin de spécifié le decay, ou :
decay: "No Decay"
```
### Bonus FirstBlood

Les bonus FirstBlood sont **permanents** et le decay ne s'applique pas :
- Points de base du challenge : soumis au decay
- Bonus FirstBlood : fixe, ne change jamais
- Score total = Points Actuels + Bonus FirstBlood

## Synchronisation des challenges

La synchronisation des challenges se fait via le script `pta-cli.sh`. Une fois vos YAML créés et modifiés, vous pouvez lancer la synchronisation des challeges vers le stockage MinIO avec la commande:

```bash
bash pta-cli.sh minio sync challenges
```

![sync-vhs](../assets/minio-sync.gif)
