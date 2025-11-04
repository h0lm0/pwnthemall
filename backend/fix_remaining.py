#!/usr/bin/env python3

# Fix challenge_admin FirstBloodBadges pointer handling
with open('controllers/challenge_admin.go', 'r') as f:
    lines = f.readlines()

# Find and replace the FirstBloodBadges block
output = []
i = 0
while i < len(lines):
    line = lines[i]
    # Look for the FirstBloodBadges assignment block
    if 'if req.FirstBloodBadges != nil && len(*req.FirstBloodBadges) > 0' in line:
        output.append(line)  # Keep the if line
        i += 1
        output.append(lines[i])  # Keep assignment line
        i += 1
        output.append(lines[i])  # Keep else if line
        i += 1
        output.append(lines[i])  # Keep else line
        i += 1
    else:
        output.append(line)
        i += 1

with open('controllers/challenge_admin.go', 'w') as f:
    f.writelines(output)

# Fix DifficultyID pointer
with open('controllers/challenge_admin.go', 'r') as f:
    content = f.read()
content = content.replace('challenge.ChallengeDifficultyID = req.DifficultyID', 'challenge.ChallengeDifficultyID = *req.DifficultyID')
with open('controllers/challenge_admin.go', 'w') as f:
    f.write(content)

print("✅ Fixed challenge_admin.go")

# Fix config DTO - add SyncWithEnv
with open('dto/config.go', 'r') as f:
    content = f.read()
content = content.replace(
    '	Public *bool   `json:"public"`',
    '	Public      *bool `json:"public"`\n	SyncWithEnv *bool `json:"syncWithEnv"`'
)
with open('dto/config.go', 'w') as f:
    f.write(content)

print("✅ Fixed config DTO")

# Fix config.go pointer usage
with open('controllers/config.go', 'r') as f:
    content = f.read()
content = content.replace('Public:      input.Public', 'Public:      func() bool { if input.Public != nil { return *input.Public }; return false }()')
content = content.replace('SyncWithEnv: input.SyncWithEnv', 'SyncWithEnv: func() bool { if input.SyncWithEnv != nil { return *input.SyncWithEnv }; return false }()')
content = content.replace('config.Public = input.Public', 'if input.Public != nil { config.Public = *input.Public }')
content = content.replace('if input.SyncWithEnv != nil { config.SyncWithEnv = input.SyncWithEnv }', 'if input.SyncWithEnv != nil { config.SyncWithEnv = *input.SyncWithEnv }')

with open('controllers/config.go', 'w') as f:
    f.write(content)

print("✅ Fixed config.go")

# Fix notification.go - add dto import if missing
with open('controllers/notification.go', 'r') as f:
    content = f.read()
if '"pwnthemall/dto"' not in content:
    content = content.replace(
        'import (\n\t"pwnthemall/config"',
        'import (\n\t"pwnthemall/config"\n\t"pwnthemall/dto"'
    )
    with open('controllers/notification.go', 'w') as f:
        f.write(content)
    print("✅ Fixed notification.go imports")
else:
    print("✅ notification.go already has dto import")

print("\n✅ All remaining fixes applied!")
