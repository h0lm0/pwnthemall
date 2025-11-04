#!/usr/bin/env python3
import re
import sys

# Controller to DTO mappings
updates = {
    'challenge_category.go': [
        ('type ChallengeCategoryInput', 'dto.ChallengeCategoryInput'),
        ('type ReorderChallengesRequest', 'dto.ReorderChallengesRequest'),
        ('ChallengeCategoryInput{', 'dto.ChallengeCategoryInput{'),
        ('ReorderChallengesRequest{', 'dto.ReorderChallengesRequest{'),
        ('var input ChallengeCategoryInput', 'var input dto.ChallengeCategoryInput'),
        ('var req ReorderChallengesRequest', 'var req dto.ReorderChallengesRequest'),
    ],
    'challenge_admin.go': [
        ('type ChallengeAdminUpdateRequest', 'dto.ChallengeAdminUpdateRequest'),
        ('type ChallengeGeneralUpdateRequest', 'dto.ChallengeGeneralUpdateRequest'),
        ('type HintRequest', 'dto.HintRequest'),
        ('ChallengeAdminUpdateRequest{', 'dto.ChallengeAdminUpdateRequest{'),
        ('ChallengeGeneralUpdateRequest{', 'dto.ChallengeGeneralUpdateRequest{'),
        ('HintRequest{', 'dto.HintRequest{'),
        ('var req ChallengeAdminUpdateRequest', 'var req dto.ChallengeAdminUpdateRequest'),
        ('var req ChallengeGeneralUpdateRequest', 'var req dto.ChallengeGeneralUpdateRequest'),
        ('var input HintRequest', 'var input dto.HintRequest'),
    ],
    'challenge.go': [
        ('type FlagInput', 'dto.FlagInput'),
        ('type GeoFlagInput', 'dto.GeoFlagInput'),
        ('type HintWithPurchased', 'dto.HintWithPurchased'),
        ('type ChallengeWithSolved', 'dto.ChallengeWithSolved'),
        ('type SolveWithUser', 'dto.SolveWithUser'),
        ('type TeamSolveEvent', 'dto.TeamSolveEvent'),
        ('type InstanceEvent', 'dto.InstanceEvent'),
        ('FlagInput{', 'dto.FlagInput{'),
        ('GeoFlagInput{', 'dto.GeoFlagInput{'),
        ('HintWithPurchased{', 'dto.HintWithPurchased{'),
        ('ChallengeWithSolved{', 'dto.ChallengeWithSolved{'),
        ('TeamSolveEvent{', 'dto.TeamSolveEvent{'),
        ('InstanceEvent{', 'dto.InstanceEvent{'),
        ('var flagInput FlagInput', 'var flagInput dto.FlagInput'),
        ('var geoInput GeoFlagInput', 'var geoInput dto.GeoFlagInput'),
    ],
    'config.go': [
        ('type ConfigInput', 'dto.ConfigInput'),
        ('ConfigInput{', 'dto.ConfigInput{'),
        ('var input ConfigInput', 'var input dto.ConfigInput'),
    ],
    'notification.go': [
        ('type NotificationInput', 'dto.NotificationInput'),
        ('type NotificationResponse', 'dto.NotificationResponse'),
        ('type SentNotificationResponse', 'dto.SentNotificationResponse'),
        ('NotificationInput{', 'dto.NotificationInput{'),
        ('NotificationResponse{', 'dto.NotificationResponse{'),
        ('SentNotificationResponse{', 'dto.SentNotificationResponse{'),
        ('var input NotificationInput', 'var input dto.NotificationInput'),
    ],
    'user.go': [
        ('type UserInput', 'dto.UserInput'),
        ('UserInput{', 'dto.UserInput{'),
        ('var input UserInput', 'var input dto.UserInput'),
    ],
    'team.go': [
        ('type TeamScore', 'dto.TeamScore'),
        ('TeamScore{', 'dto.TeamScore{'),
    ],
}

# Add dto import to all these files
for filename in updates.keys():
    filepath = f'controllers/{filename}'
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Remove type definitions
        for old, new in updates[filename]:
            if old.startswith('type '):
                # Remove the entire type definition
                pattern = rf'{re.escape(old)}[^}}]*}}'
                content = re.sub(pattern, '', content)
            else:
                content = content.replace(old, new)
        
        # Add dto import if not present
        if '"pwnthemall/dto"' not in content:
            content = content.replace(
                'import (\n\t"pwnthemall/config"',
                'import (\n\t"pwnthemall/config"\n\t"pwnthemall/dto"'
            )
        
        with open(filepath, 'w') as f:
            f.write(content)
        
        print(f'✅ Updated {filename}')
    except Exception as e:
        print(f'❌ Error updating {filename}: {e}')

print('\n✅ All controllers updated!')
