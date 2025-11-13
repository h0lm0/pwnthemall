package controllers

import (
	"encoding/json"
	"fmt"
	"pwnthemall/config"
	"pwnthemall/debug"
	"pwnthemall/dto"
	"pwnthemall/models"
	"pwnthemall/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SubmitChallenge handles challenge flag submission
func SubmitChallenge(c *gin.Context) {
	var challenge models.Challenge

	challengeId := c.Param("id")
	if err := config.DB.Preload("Flags").Preload("ChallengeType").Where("id = ?", challengeId).First(&challenge).Error; err != nil {
		utils.NotFoundError(c, "challenge_not_found")
		return
	}

	var inputRaw map[string]interface{}
	if err := c.ShouldBindJSON(&inputRaw); err != nil {
		utils.BadRequestError(c, "invalid_input")
		return
	}

	userI, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedError(c, "unauthorized")
		return
	}
	user, ok := userI.(*models.User)
	if !ok {
		utils.InternalServerError(c, "user_wrong_type")
		return
	}

	// Block all users (including admins) from submitting if not in a team
	if user.Team == nil || user.TeamID == nil {
		utils.ForbiddenError(c, "team_required")
		return
	}

	// Check CTF timing - block flag submission when CTF hasn't started or has ended
	ctfStatus := config.GetCTFStatus()
	if ctfStatus == config.CTFNotStarted {
		utils.ForbiddenError(c, "flag_submission_not_available_yet")
		return
	}
	if ctfStatus == config.CTFEnded {
		utils.ForbiddenError(c, "flag_submission_no_longer_available")
		return
	}

	// Check if team has already solved this challenge
	var existingSolve models.Solve
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challenge.ID).First(&existingSolve).Error; err == nil {
		utils.ConflictError(c, "challenge_already_solved")
		return
	}

	submittedValue := ""
	if v, ok := inputRaw["flag"]; ok {
		if s, ok := v.(string); ok {
			submittedValue = s
		}
	}
	if submittedValue == "" {
		// Maybe geo submission
		if latV, ok := inputRaw["lat"].(float64); ok {
			if lngV, ok2 := inputRaw["lng"].(float64); ok2 {
				submittedValue = fmt.Sprintf("geo:%f,%f", latV, lngV)
			}
		}
	}

	var submission models.Submission
	if err := config.DB.FirstOrCreate(&submission, models.Submission{Value: submittedValue, UserID: user.ID, ChallengeID: challenge.ID}).Error; err != nil {
		utils.InternalServerError(c, "submission_create_failed")
	}

	found := false
	// Standard flag check and geo check
	for _, flag := range challenge.Flags {
		if utils.IsGeoFlag(flag.Value) {
			// Compare against a geo submission
			if lat, lng, rad, ok := utils.ParseGeoSpecFromHashed(flag.Value); ok {
				if v, ok := inputRaw["lat"].(float64); ok {
					if w, ok2 := inputRaw["lng"].(float64); ok2 {
						if utils.IsWithinRadiusKm(lat, lng, v, w, rad) {
							found = true
							break
						}
					}
				}
			}
		} else if submittedValue != "" && flag.Value == utils.HashFlag(submittedValue) {
			found = true
			break
		} else if v, ok := inputRaw["flag"].(string); ok && flag.Value == utils.HashFlag(v) {
			found = true
			break
		}
	}

	// If not found yet and challenge is geo, validate against stored GeoSpec
	if !found && challenge.ChallengeType != nil && strings.ToLower(challenge.ChallengeType.Name) == "geo" {
		if v, ok := inputRaw["lat"].(float64); ok {
			if w, ok2 := inputRaw["lng"].(float64); ok2 {
				var spec models.GeoSpec
				if err := config.DB.Where("challenge_id = ?", challenge.ID).First(&spec).Error; err == nil {
					if utils.IsWithinRadiusKm(spec.TargetLat, spec.TargetLng, v, w, spec.RadiusKm) {
						debug.Log("Geo submission within radius for challenge %d (lat=%f,lng=%f) target(%f,%f) radius=%f",
							challenge.ID, v, w, spec.TargetLat, spec.TargetLng, spec.RadiusKm)
						found = true
					}
				}
			}
		}
	}
	if found {
		// Calculate solve position and first blood bonus before creating solve
		var position int64
		config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challenge.ID).Count(&position)

		debug.Log("FirstBlood: Challenge %d, Position %d, EnableFirstBlood: %v, Bonuses count: %d",
			challenge.ID, position, challenge.EnableFirstBlood, len(challenge.FirstBloodBonuses))

		firstBloodBonus := 0
		if challenge.EnableFirstBlood && len(challenge.FirstBloodBonuses) > 0 {
			pos := int(position)
			if pos < len(challenge.FirstBloodBonuses) {
				firstBloodBonus = int(challenge.FirstBloodBonuses[pos])
				debug.Log("FirstBlood: Position %d gets bonus %d points", pos, firstBloodBonus)
			} else {
				debug.Log("FirstBlood: Position %d beyond configured bonuses (%d available)", pos, len(challenge.FirstBloodBonuses))
			}
		} else {
			debug.Log("FirstBlood: FirstBlood not enabled or no bonuses configured")
		}

		var solve models.Solve
		if err := config.DB.FirstOrCreate(&solve,
			models.Solve{
				TeamID:      user.Team.ID,
				ChallengeID: challenge.ID,
				UserID:      user.ID,
				Points:      challenge.Points + firstBloodBonus, // Include first blood bonus in solve points
			}).Error; err != nil {
			utils.InternalServerError(c, "solve_create_failed")
			return
		} else {
			// Create FirstBlood entry if applicable
			if firstBloodBonus > 0 {
				// Get badge for this position if available
				badge := "trophy" // default badge
				if int(position) < len(challenge.FirstBloodBadges) {
					badge = challenge.FirstBloodBadges[position]
				}

				firstBlood := models.FirstBlood{
					ChallengeID: challenge.ID,
					TeamID:      user.Team.ID,
					UserID:      user.ID,
					Bonuses:     []int64{int64(firstBloodBonus)},
					Badges:      []string{badge},
				}

				if err := config.DB.Create(&firstBlood).Error; err != nil {
					debug.Log("Failed to create FirstBlood entry: %v", err)
				} else {
					debug.Log("Created FirstBlood entry for user %d, challenge %d, position %d, bonus %d points",
						user.ID, challenge.ID, position, firstBloodBonus)
				}
			}
			// Broadcast team solve event over WebSocket

			event := dto.TeamSolveEvent{
				Event:         "team_solve",
				TeamID:        user.Team.ID,
				ChallengeID:   challenge.ID,
				ChallengeName: challenge.Name,
				Points:        challenge.Points + firstBloodBonus, // Include first blood bonus in event
				UserID:        user.ID,
				Username:      user.Username,
				Timestamp:     time.Now().UTC().Unix(),
			}
			if WebSocketHub != nil {
				if payload, err := json.Marshal(event); err == nil {
					WebSocketHub.SendToTeamExcept(user.Team.ID, user.ID, payload)
				}
			}

			// Best-effort: stop any running instance for this team and challenge when solved
			go func(teamID uint, chalID uint, actorID uint, actorName string) {
				var instance models.Instance
				if err := config.DB.Where("team_id = ? AND challenge_id = ?", teamID, chalID).First(&instance).Error; err == nil {
					// Try stopping the container
					if instance.Container != "" {
						if err := utils.StopDockerInstance(instance.Container); err != nil {
							debug.Log("Failed to stop Docker instance on solve: %v", err)
						}
					}
					// Remove instance record to free the slot
					if err := config.DB.Delete(&instance).Error; err != nil {
						debug.Log("Failed to delete instance on solve: %v", err)
					}

					// Notify team listeners that instance stopped
					if WebSocketHub != nil {

						evt := dto.InstanceEvent{
							Event:       "instance_update",
							TeamID:      teamID,
							UserID:      actorID,
							Username:    actorName,
							ChallengeID: chalID,
							Status:      "stopped",
							UpdatedAt:   time.Now().UTC().Unix(),
						}
						if payload, err := json.Marshal(evt); err == nil {
							WebSocketHub.SendToTeamExcept(teamID, actorID, payload)
						}
					}
				}
			}(user.Team.ID, challenge.ID, user.ID, user.Username)

			utils.OKResponse(c, gin.H{"message": "challenge_solved"})
			return
		}
	} else {
		if challenge.ChallengeType != nil && strings.ToLower(challenge.ChallengeType.Name) == "geo" {
			utils.ForbiddenError(c, "incorrect_location")
		} else {
			utils.ForbiddenError(c, "wrong_flag")
		}
	}
}

// GetChallengeSolves returns all solves for a challenge with user information
func GetChallengeSolves(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	result := config.DB.First(&challenge, id)
	if result.Error != nil {
		utils.NotFoundError(c, "Challenge not found")
		return
	}

	// Get solves with team information
	var solves []models.Solve
	result = config.DB.
		Preload("Team").
		Where("challenge_id = ?", challenge.ID).
		Order("created_at ASC").
		Find(&solves)

	if result.Error != nil {
		utils.InternalServerError(c, result.Error.Error())
		return
	}

	var solvesWithUsers []dto.SolveWithUser

	for _, solve := range solves {
		// Find the submission that led to this solve
		var submission models.Submission
		submissionResult := config.DB.
			Preload("User").
			Where("challenge_id = ? AND user_id IN (SELECT id FROM users WHERE team_id = ?) AND created_at <= ?",
				challenge.ID, solve.TeamID, solve.CreatedAt).
			Order("created_at DESC").
			First(&submission)

		solveWithUser := dto.SolveWithUser{
			Solve: solve,
		}

		if submissionResult.Error == nil && submission.User != nil {
			solveWithUser.UserID = submission.UserID
			solveWithUser.Username = submission.User.Username
		}

		// Check if this solve has a FirstBlood entry
		var firstBlood models.FirstBlood
		if err := config.DB.Where("challenge_id = ? AND team_id = ? AND user_id = ?",
			challenge.ID, solve.TeamID, solve.UserID).First(&firstBlood).Error; err == nil {
			solveWithUser.FirstBlood = &firstBlood
		}

		solvesWithUsers = append(solvesWithUsers, solveWithUser)
	}

	utils.OKResponse(c, solvesWithUsers)
}
