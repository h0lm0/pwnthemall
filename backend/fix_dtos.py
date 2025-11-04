#!/usr/bin/env python3
import re

# Fix challenge_admin.go pointer dereferencing
with open('controllers/challenge_admin.go', 'r') as f:
    content = f.read()

content = re.sub(r'challenge\.DecayFormulaID = req\.DecayFormulaID', 'challenge.DecayFormulaID = *req.DecayFormulaID', content)
content = re.sub(r'challenge\.EnableFirstBlood = req\.EnableFirstBlood', 'challenge.EnableFirstBlood = *req.EnableFirstBlood', content)
content = re.sub(r'challenge\.Hidden = req\.Hidden', 'challenge.Hidden = *req.Hidden', content)
content = re.sub(r'challenge\.ChallengeCategoryID = req\.CategoryID', 'challenge.ChallengeCategoryID = *req.CategoryID', content)

with open('controllers/challenge_admin.go', 'w') as f:
    f.write(content)

print("✅ Fixed challenge_admin.go")

# Add DifficultyID and Public fields to DTOs
with open('dto/challenge.go', 'r') as f:
    content = f.read()

content = content.replace(
    '	Author      string `json:"author"`\n	Hidden      *bool  `json:"hidden"`\n	CategoryID  *uint  `json:"categoryId"`',
    '	Author       string `json:"author"`\n	Hidden       *bool  `json:"hidden"`\n	CategoryID   *uint  `json:"categoryId"`\n	DifficultyID *uint  `json:"difficultyId"`'
)

with open('dto/challenge.go', 'w') as f:
    f.write(content)

print("✅ Fixed challenge DTO")

# Fix config DTO
with open('dto/config.go', 'r') as f:
    content = f.read()

content = content.replace(
    '	Value string `json:"value" binding:"required"`',
    '	Value  string `json:"value" binding:"required"`\n	Public *bool   `json:"public"`'
)

with open('dto/config.go', 'w') as f:
    f.write(content)

print("✅ Fixed config DTO")

# Fix challenge_category controller
with open('controllers/challenge_category.go', 'r') as f:
    content = f.read()

content = content.replace('req.ChallengeIds', 'req.ChallengeIDs')

with open('controllers/challenge_category.go', 'w') as f:
    f.write(content)

print("✅ Fixed challenge_category.go")

print("\n✅ All fixes applied!")
