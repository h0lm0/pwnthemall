# Usage

This page explains how to use pwnthemall, starting with creating challenges.

## Creating challenges

All challenges must be placed in the following folder:

```
minio/challenges/[challenge_name]
```

Inside `[challenge_name]`, there **must** be a file called `chall.yml`. This file defines the challenge.  

Examples of YAML files can be found in [docs/challenges/](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges)

### Types of challenges

1. **Standard**  
   - A flag to find based on a description.  
   - Exemple : [docs/challenges/standard.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 01"
      description: |
         Standard challenge example

         Make a team and enter the flag "flag" to solve it !
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
   - A flag to find in a dedicated containerized environment.  
   - Exemple : [docs/challenges/docker.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 02 (Docker)"
      description: |
         Simple challenge using Docker container.

         The flag is "flag"
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
   - A flag to find in an environment with multiple dedicated containers.  
   - Exemple : [docs/challenges/compose.chall.yml](https://github.com/h0lm0/pwnthemall/tree/main/docs/challenges/standard.chall.yml)
      ```yaml
      name: "Demo 04 (Compose)"
      description: |
         Compose challenge example

         Enter the flag "flag" to solve it !
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

## Challenge Dependencies

The `depends_on` field is **optional** and allows you to create challenge chains by requiring teams to solve one challenge before accessing another.

### How It Works

- Challenges are **hidden** from teams until the dependency is solved
- Once the required challenge is solved, the dependent challenge appears in the list
- Admins can always see and access all challenges regardless of dependencies

### Usage

```yaml
depends_on: "Challenge Name"  # Exact name of the challenge that must be solved first
```

### Example: Progressive Challenge Chain

```yaml
# Challenge 1
name: "The Mayor's Story [1/3]"
category: osint
difficulty: easy
points: 100
flags: ["flag1"]
# No depends_on - this is the first challenge
```

```yaml
# Challenge 2 (requires Challenge 1)
name: "The Mayor's Story [2/3]"
category: osint
difficulty: medium
points: 200
flags: ["flag2"]
depends_on: "The Mayor's Story [1/3]"
```

```yaml
# Challenge 3 (requires Challenge 2)
name: "The Mayor's Story [3/3]"
category: osint
difficulty: hard
points: 300
flags: ["flag3"]
depends_on: "The Mayor's Story [2/3]"
```

This creates a chain: **Challenge 1** → **Challenge 2** → **Challenge 3**

## Decay System

The `decay` field is **optional** and controls how challenge points decrease as more teams solve it. If not specified, challenges will have **no decay** (fixed points).

### Available decay formulas

- **No Decay** - Points remain constant regardless of solves
- **Logarithmic - Ultra Slow** - Very minimal decay (step: 10, min: 10 pts)
- **Logarithmic - Very Slow** - Slow decay (step: 25, min: 25 pts)
- **Logarithmic - Slow** - Moderately slow decay (step: 50, min: 100 pts)
- **Logarithmic - Medium** - Balanced decay (step: 75, min: 75 pts)
- **Logarithmic - Fast** - Aggressive decay (step: 100, min: 50 pts)

### How It Works

Logarithmic decay uses the formula: `points = basePoints - (step × log₂(solveNumber))`

- The **first solve** always receives full points (no decay)
- Points decay quickly for early solves, then slow down
- Points never go below the specified minimum

Example with 500 base points and "Logarithmic - Medium" (step: 75, min: 75):
- 1st solve: 500 pts
- 2nd solve: 425 pts (500 - 75×1)
- 3rd solve: 381 pts (500 - 75×1.58)
- 5th solve: 326 pts (500 - 75×2.32)
- 10th solve: 251 pts (500 - 75×3.32)
- 20th solve: 176 pts (500 - 75×4.32)
- 50th+ solve: 75 pts (minimum)

### Usage

```yaml
# With decay
decay: "Logarithmic - Medium"

# Without decay (default if omitted)
# No need to specify the decay field, or:
decay: "No Decay"
```
### FirstBlood Bonuses

FirstBlood bonuses are **permanent** and decay does not apply:
- Base challenge points: subject to decay
- FirstBlood bonus: fixed, never changes
- Total score = Current Points + FirstBlood Bonus

## Challenge synchronization

Challenge synchronization is handled via the `pta-cli.sh` script. Once your YAML files have been created or modified, you can synchronize the challenges to the MinIO storage using the following command:

```bash
bash pta-cli.sh minio sync challenges
```

![sync-vhs](../assets/minio-sync.gif)
