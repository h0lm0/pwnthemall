# Usage

This page explains how to use pwnthemall, starting with creating challenges.

## Creating Challenges

All challenges must be placed in the following folder:

```
minio/challenges/[challenge_name]
```

Inside `[challenge_name]`, there **must** be a file called `chall.yml`. This file defines the challenge.  

Examples of YAML files can be found in [docs/challenges/](docs/challenges)

### Types of Challenges

1. **Standard**  
   - A flag to find based on a description.  
   - Example: `docs/challenges/standard.chall.yml`

2. **Docker**  
   - A flag to find in a dedicated containerized environment.  
   - Example: `docs/challenges/docker.chall.yml`

3. **Geo**  
   - A location to pin on a world map based on clues in the description.  
   - Example: `docs/challenges/geo.chall.yml`

4. **Compose** *(WIP – not finished yet)*  
   - A flag to find in an environment with multiple dedicated containers.  
   - Example: `docs/challenges/compose.chall.yml`
