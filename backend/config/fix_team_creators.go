package config

import (
	"log"
	"pwnthemall/models"
)

// FixTeamCreators fixes teams that have CreatorID = 0 by setting the first member as creator
func FixTeamCreators() {
	var teams []models.Team
	
	// Find teams with CreatorID = 0
	if err := DB.Where("creator_id = 0 OR creator_id IS NULL").Find(&teams).Error; err != nil {
		log.Printf("Error finding teams with no creator: %v\n", err)
		return
	}
	
	for _, team := range teams {
		// Find the first user in this team
		var firstMember models.User
		if err := DB.Where("team_id = ?", team.ID).Order("created_at ASC, id ASC").First(&firstMember).Error; err != nil {
			log.Printf("No members found for team %s (ID: %d), skipping\n", team.Name, team.ID)
			continue
		}
		
		// Update the team's CreatorID
		team.CreatorID = firstMember.ID
		if err := DB.Save(&team).Error; err != nil {
			log.Printf("Failed to update CreatorID for team %s: %v\n", team.Name, err)
		} else {
			log.Printf("Fixed team %s - set creator to user %s (ID: %d)\n", team.Name, firstMember.Username, firstMember.ID)
		}
	}
	
	log.Println("Team creator fix completed")
} 