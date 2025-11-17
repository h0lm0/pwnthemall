package controllers

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"strings"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/dto"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
	"gorm.io/gorm"
)

// GetChallenges returns all visible challenges
func GetChallenges(c *gin.Context) {
	var challenges []models.Challenge
	result := config.DB.Where("hidden = false").Find(&challenges)
	if result.Error != nil {
		utils.InternalServerError(c, result.Error.Error())
		return
	}
	utils.OKResponse(c, challenges)
}

// GetChallenge returns a single challenge by ID
func GetChallenge(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	result := config.DB.First(&challenge, id)
	if result.Error != nil {
		utils.NotFoundError(c, "Challenge not found")
		return
	}
	utils.OKResponse(c, challenge)
}

// GetChallengesByCategoryName returns all challenges in a category with solved status
func GetChallengesByCategoryName(c *gin.Context) {
	categoryName := c.Param("category")

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

	// Check CTF timing - only allow access if CTF has started or user is admin
	if !config.IsCTFStarted() && user.Role != "admin" {
		utils.OKResponse(c, []interface{}{}) // Return empty array instead of error
		return
	}

	var challenges []models.Challenge
	result := config.DB.
		Preload("ChallengeCategory").
		Preload("ChallengeType").
		Preload("ChallengeDifficulty").
		Preload("Hints").
		Joins("JOIN challenge_categories ON challenge_categories.id = challenges.challenge_category_id").
		Where("challenge_categories.name = ? and hidden = false", categoryName).
		Order("challenges.\"order\" ASC, challenges.id ASC").
		Find(&challenges)

	if result.Error != nil {
		utils.InternalServerError(c, result.Error.Error())
		return
	}

	// Get solved challenges for the user's team
	var solvedChallengeIds []uint
	var purchasedHintIds []uint
	if user.Team != nil {
		var solves []models.Solve
		if err := config.DB.Where("team_id = ?", user.Team.ID).Find(&solves).Error; err == nil {
			for _, solve := range solves {
				solvedChallengeIds = append(solvedChallengeIds, solve.ChallengeID)
			}
		}

		// Get purchased hints for the team
		var purchases []models.HintPurchase
		if err := config.DB.Where("team_id = ?", user.Team.ID).Find(&purchases).Error; err == nil {
			for _, purchase := range purchases {
				purchasedHintIds = append(purchasedHintIds, purchase.HintID)
			}
		}
	}

	var challengesWithSolved []dto.ChallengeWithSolved
	decayService := utils.NewDecay()

	// Check and activate scheduled hints before processing
	utils.CheckAndActivateHintsForChallenges(challenges)

	// Get failed attempts count for team's challenges (if user has a team)
	failedAttemptsMap := make(map[uint]int64)
	if user.Team != nil {
		for _, challenge := range challenges {
			if challenge.MaxAttempts > 0 {
				var count int64
				config.DB.Model(&models.Submission{}).
					Joins("JOIN users ON users.id = submissions.user_id").
					Where("users.team_id = ? AND submissions.challenge_id = ? AND submissions.is_correct = ?",
						user.Team.ID, challenge.ID, false).
					Count(&count)
				failedAttemptsMap[challenge.ID] = count
			}
		}
	}

	for _, challenge := range challenges {
		solved := false
		for _, solvedId := range solvedChallengeIds {
			if challenge.ID == solvedId {
				solved = true
				break
			}
		}
		// Compute current points (decay-aware) for display
		challenge.CurrentPoints = decayService.CalculateCurrentPoints(&challenge)

		// Process hints with purchase status - only include active hints
		var hintsWithPurchased []dto.HintWithPurchased
		for _, hint := range challenge.Hints {
			debug.Log("Hint ID %d: IsActive=%t, User Role=%s", hint.ID, hint.IsActive, user.Role)
			// Skip inactive hints unless user is admin
			if !hint.IsActive && user.Role != "admin" {
				debug.Log("Skipping inactive hint ID %d for non-admin user", hint.ID)
				continue
			}

			purchased := false
			for _, purchasedId := range purchasedHintIds {
				if hint.ID == purchasedId {
					purchased = true
					break
				}
			}
			hintsWithPurchased = append(hintsWithPurchased, dto.HintWithPurchased{
				Hint:      hint,
				Purchased: purchased,
			})
		}

		item := dto.ChallengeWithSolved{
			Challenge:          challenge,
			Solved:             solved,
			Hints:              hintsWithPurchased,
			TeamFailedAttempts: failedAttemptsMap[challenge.ID],
		}
		if challenge.ChallengeType != nil && strings.ToLower(challenge.ChallengeType.Name) == "geo" {
			var spec models.GeoSpec
			if err := config.DB.Where("challenge_id = ?", challenge.ID).First(&spec).Error; err == nil {
				r := spec.RadiusKm
				item.GeoRadiusKm = &r
			}
		}
		challengesWithSolved = append(challengesWithSolved, item)
	}

	utils.OKResponse(c, challengesWithSolved)
}

// CreateChallenge creates a new challenge with optional file upload
func CreateChallenge(c *gin.Context) {
	const maxSizePerFile = 1024 * 1024 * 256 // 256 MB

	var zipBuffer bytes.Buffer
	zipWriter := zip.NewWriter(&zipBuffer)
	hasFiles := false

	form, err := c.MultipartForm()
	if err != nil {
		if err != http.ErrNotMultipart && err != http.ErrMissingBoundary {
			utils.BadRequestError(c, "invalid_multipart_form")
			return
		}
	}

	if form != nil && form.File != nil {
		if files, ok := form.File["files"]; ok {
			for _, fileHeader := range files {
				if fileHeader.Size > maxSizePerFile {
					utils.BadRequestError(c, fmt.Sprintf("file %s exceeds max size (256MB)", fileHeader.Filename))
					return
				}
				file, err := fileHeader.Open()
				if err != nil {
					utils.InternalServerError(c, err.Error())
					return
				}
				defer file.Close()

				w, err := zipWriter.Create(fileHeader.Filename)
				if err != nil {
					utils.InternalServerError(c, err.Error())
					return
				}
				if _, err = io.Copy(w, file); err != nil {
					utils.InternalServerError(c, err.Error())
					return
				}
				hasFiles = true
			}
		}
	}

	if err := zipWriter.Close(); err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	metaStr := c.PostForm("meta")
	if metaStr == "" {
		utils.BadRequestError(c, "missing_meta")
		return
	}

	var metaMap map[string]interface{}
	if err := json.Unmarshal([]byte(metaStr), &metaMap); err != nil {
		utils.BadRequestError(c, "invalid_meta_json")
		return
	}

	var challenge models.Challenge
	challengeBytes, _ := json.Marshal(metaMap)
	if err := json.Unmarshal(challengeBytes, &challenge); err != nil {
		utils.BadRequestError(c, "invalid_challenge_data")
		return
	}

	if challenge.Name == "" {
		utils.BadRequestError(c, "missing_challenge_name")
		return
	}

	result := config.DB.Create(&challenge)
	if result.Error != nil {
		utils.InternalServerError(c, "challenge_creation_failed")
		return
	}

	if hasFiles {
		zipBytes := zipBuffer.Bytes()
		zipFilename := fmt.Sprintf("%s.zip", challenge.Slug)
		objectName := fmt.Sprintf("challenges/%s", zipFilename)
		_, err := config.FS.PutObject(
			context.Background(),
			"challenge-files",
			objectName,
			bytes.NewReader(zipBytes),
			int64(len(zipBytes)),
			minio.PutObjectOptions{ContentType: "application/zip"},
		)
		if err != nil {
			config.DB.Delete(&challenge)
			utils.InternalServerError(c, err.Error())
			return
		}
	}

	utils.CreatedResponse(c, challenge)
}

// GetChallengeFirstBloods returns the first blood information for a challenge
func GetChallengeFirstBloods(c *gin.Context) {
	challengeIDStr := c.Param("id")

	var firstBloods []models.FirstBlood
	err := config.DB.Preload("Challenge").
		Preload("Team").
		Preload("User").
		Where("challenge_id = ?", challengeIDStr).
		Order("created_at ASC").
		Find(&firstBloods).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.OKResponse(c, []models.FirstBlood{})
			return
		}
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.OKResponse(c, firstBloods)
}
