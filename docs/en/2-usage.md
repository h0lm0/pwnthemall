# Usage

This page explains how to use pwnthemall, starting with creating challenges.

## Creating Challenges

All challenges must be placed in the following folder:

```
minio/challenges/[challenge_name]
```

Inside `[challenge_name]`, there **must** be a file called `chall.yml`. This file defines the challenge.  

Examples of YAML files can be found in [docs/challenges/](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges)

### Types of Challenges

1. **Standard**  
   - A flag to find based on a description.  
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
   - A flag to find in a dedicated containerized environment.  
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
   - A location to pin on a world map based on clues in the description.  
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

4. **Compose** *(WIP – not finished yet)*  
   - A flag to find in an environment with multiple dedicated containers.  
   - Exemple : [docs/challenges/compose.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 04 (Compose - WIP)"
      ```
