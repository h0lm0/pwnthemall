package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"pwnthemall/config"
	"pwnthemall/meta"
	"pwnthemall/models"

	"github.com/lib/pq"
	"github.com/minio/minio-go/v7"
	"gopkg.in/yaml.v2"
	"gorm.io/gorm"
)

func SyncChallengesFromMinIO(ctx context.Context, key string, updatesHub *Hub) error {
	const bucketName = "challenges"
	// Key can be in two forms depending on MinIO webhook config:
	// 1) "challenges/<slug>/chall.yml" (includes bucket)
	// 2) "<slug>/chall.yml" (object key only)
	objectKey := key
	parts := strings.SplitN(key, "/", 2)
	if len(parts) == 2 && parts[0] == bucketName {
		objectKey = parts[1]
	}
	log.Printf("SyncChallengesFromMinIO begin for bucket: %s, key: %s", bucketName, objectKey)

	time.Sleep(500 * time.Millisecond)
	obj, err := config.FS.GetObject(ctx, bucketName, objectKey, minio.GetObjectOptions{})
	_, statErr := obj.Stat()
	if err != nil || statErr != nil {
		log.Printf("Object not found or error retrieving object %s: %v", objectKey, err)
		slug := strings.Split(objectKey, "/")[0]
		if err := deleteChallengeFromDB(slug); err != nil {
			log.Printf("Error deleting challenge from DB: %v", err)
			return err
		}
		log.Printf("Deleted challenge with slug %s from DB", slug)
		return nil
	}
	defer obj.Close()

	// Read the object content
	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(obj); err != nil {
		log.Printf("Error reading object %s: %v", objectKey, err)
		return err
	}

	var base meta.BaseChallengeMetadata
	if err := yaml.Unmarshal(buf.Bytes(), &base); err != nil {
		log.Printf("Invalid YAML for %s: %v", objectKey, err)
		return err
	}

	var (
		metaData meta.BaseChallengeMetadata
		ports    []int
	)

	switch base.Type {
	case "docker":
		var dockerMeta meta.DockerChallengeMetadata
		if err := yaml.Unmarshal(buf.Bytes(), &dockerMeta); err != nil {
			log.Printf("Invalid Docker YAML for %s: %v", objectKey, err)
			return err
		}
		metaData = dockerMeta.Base
		ports = dockerMeta.Ports

	case "compose":
		var composeMeta meta.ComposeChallengeMetadata
		if err := yaml.Unmarshal(buf.Bytes(), &composeMeta); err != nil {
			log.Printf("Invalid Compose YAML for %s: %v", objectKey, err)
			return err
		}
		metaData = composeMeta.Base
		ports = composeMeta.Ports

	case "geo":
		var geoMeta meta.GeoChallengeMetadata
		if err := yaml.Unmarshal(buf.Bytes(), &geoMeta); err != nil {
			log.Printf("Invalid Geo YAML for %s: %v", objectKey, err)
			return err
		}
		defer func(slug string, g meta.GeoChallengeMetadata) {
			// after challenge record is saved below, persist GeoSpec
			var challenge models.Challenge
			if err := config.DB.Where("slug = ?", slug).First(&challenge).Error; err == nil {
				var existing models.GeoSpec
				if err := config.DB.Where("challenge_id = ?", challenge.ID).First(&existing).Error; err == nil {
					existing.TargetLat = g.TargetLat
					existing.TargetLng = g.TargetLng
					existing.RadiusKm = g.RadiusKm
					_ = config.DB.Save(&existing).Error
				} else {
					gs := models.GeoSpec{ChallengeID: challenge.ID, TargetLat: g.TargetLat, TargetLng: g.TargetLng, RadiusKm: g.RadiusKm}
					_ = config.DB.Create(&gs).Error
				}
			}
		}(strings.Split(objectKey, "/")[0], geoMeta)
		var composeMeta meta.ComposeChallengeMetadata
		if err := yaml.Unmarshal(buf.Bytes(), &composeMeta); err != nil {
			log.Printf("Invalid Compose YAML for %s: %v", objectKey, err)
			return err
		}
		metaData = composeMeta.Base

	default: // standard
		metaData = base
	}
	// Update or create the challenge in the database
	slug := strings.Split(objectKey, "/")[0]
	if err := updateOrCreateChallengeInDB(metaData, slug, ports, updatesHub); err != nil {
		log.Printf("Error updating or creating challenge in DB: %v", err)
		return err
	}

	log.Printf("Synced %s to DB", objectKey)
	return nil
}

func deleteChallengeFromDB(slug string) error {
	var challenge models.Challenge
	if err := config.DB.Where("slug = ?", slug).Delete(&challenge).Error; err != nil {
		return err
	}
	return nil
}

func updateOrCreateChallengeInDB(metaData meta.BaseChallengeMetadata, slug string, ports []int, updatesHub *Hub) error {
	var cCategory models.ChallengeCategory
	if err := config.DB.FirstOrCreate(&cCategory, models.ChallengeCategory{Name: metaData.Category}).Error; err != nil {
		return err
	}

	var cDifficulty models.ChallengeDifficulty
	if err := config.DB.FirstOrCreate(&cDifficulty, models.ChallengeDifficulty{Name: metaData.Difficulty}).Error; err != nil {
		return err
	}

	var cType models.ChallengeType
	if err := config.DB.FirstOrCreate(&cType, models.ChallengeType{Name: metaData.Type}).Error; err != nil {
		return err
	}

	var cDecayFormula models.DecayFormula
	if err := config.DB.FirstOrCreate(&cDecayFormula, models.DecayFormula{Name: cDecayFormula.Name, Step: cDecayFormula.Step, MinPoints: cDecayFormula.MinPoints}).Error; err != nil {
		return err
	}
	var challenge models.Challenge
	if err := config.DB.Where("slug = ?", slug).First(&challenge).Error; err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	challenge.Slug = slug
	challenge.Name = metaData.Name
	challenge.Description = metaData.Description
	challenge.ChallengeDifficultyID = cDifficulty.ID
	challenge.ChallengeCategoryID = cCategory.ID
	challenge.ChallengeTypeID = cType.ID
	challenge.ChallengeType = &cType
	challenge.Author = metaData.Author
	challenge.Hidden = metaData.Hidden
	challenge.Points = metaData.Points
	challenge.DecayFormula = &cDecayFormula
	ports64 := make(pq.Int64Array, len(ports))
	for i, p := range ports {
		ports64[i] = int64(p)
	}
	challenge.Ports = ports64

	// Handle connection_info
	if len(metaData.ConnectionInfo) > 0 {
		connInfo := make(pq.StringArray, len(metaData.ConnectionInfo))
		copy(connInfo, metaData.ConnectionInfo)
		challenge.ConnectionInfo = connInfo
	} else {
		challenge.ConnectionInfo = pq.StringArray{}
	}

	// Handle First Blood configuration
	challenge.EnableFirstBlood = metaData.EnableFirstBlood
	if metaData.FirstBlood != nil {
		if len(metaData.FirstBlood.Bonuses) > 0 {
			bonuses64 := make(pq.Int64Array, len(metaData.FirstBlood.Bonuses))
			for i, bonus := range metaData.FirstBlood.Bonuses {
				bonuses64[i] = int64(bonus)
			}
			challenge.FirstBloodBonuses = bonuses64
		} else {
			challenge.FirstBloodBonuses = pq.Int64Array{}
		}

		if len(metaData.FirstBlood.Badges) > 0 {
			badgesArray := make(pq.StringArray, len(metaData.FirstBlood.Badges))
			copy(badgesArray, metaData.FirstBlood.Badges)
			challenge.FirstBloodBadges = badgesArray
		} else {
			challenge.FirstBloodBadges = pq.StringArray{}
		}
	} else {
		challenge.FirstBloodBonuses = pq.Int64Array{}
		challenge.FirstBloodBadges = pq.StringArray{}
	}

	if err := config.DB.Save(&challenge).Error; err != nil {
		return err
	}

	// Broadcast category update (MinIO sync affects challenges/categories)
	if updatesHub != nil {
		if payload, err := json.Marshal(map[string]interface{}{
			"event":  "challenge-category",
			"action": "minio_sync",
		}); err == nil {
			updatesHub.SendToAll(payload)
		}
	}

	if err := config.DB.Where("challenge_id = ?", challenge.ID).Delete(&models.Flag{}).Error; err != nil {
		return err
	}

	for _, flagValue := range metaData.Flags {
		hashed := HashFlag(flagValue)
		newFlag := models.Flag{
			Value:       hashed,
			ChallengeID: challenge.ID,
		}
		if err := config.DB.Create(&newFlag).Error; err != nil {
			return err
		}
	}

	// Handle hints from YAML
	if len(metaData.Hints) > 0 {
		// Delete existing hints to replace them with YAML configuration
		if err := config.DB.Where("challenge_id = ?", challenge.ID).Delete(&models.Hint{}).Error; err != nil {
			return err
		}

		// Create hints from YAML metadata
		for _, hintMeta := range metaData.Hints {
			// Default IsActive to true if not explicitly set
			isActive := true
			if hintMeta.IsActive != nil {
				isActive = *hintMeta.IsActive
				log.Printf("Hint '%s': IsActive explicitly set to %v", hintMeta.Title, isActive)
			} else {
				log.Printf("Hint '%s': IsActive not set, using default true", hintMeta.Title)
			}

			hint := models.Hint{
				ChallengeID: challenge.ID,
				Title:       hintMeta.Title,
				Content:     hintMeta.Content,
				Cost:        hintMeta.Cost,
				IsActive:    isActive,
			}

			// Parse AutoActiveAt if provided
			if hintMeta.AutoActiveAt != nil {
				if autoActiveTime, err := time.Parse(time.RFC3339, *hintMeta.AutoActiveAt); err == nil {
					hint.AutoActiveAt = &autoActiveTime
					log.Printf("Hint '%s': AutoActiveAt set to %v", hintMeta.Title, autoActiveTime)
				} else {
					log.Printf("Hint '%s': Failed to parse AutoActiveAt '%s': %v", hintMeta.Title, *hintMeta.AutoActiveAt, err)
				}
			}

			log.Printf("About to create hint '%s' with IsActive=%v", hintMeta.Title, hint.IsActive)
			if err := config.DB.Select("ChallengeID", "Title", "Content", "Cost", "IsActive", "AutoActiveAt").Create(&hint).Error; err != nil {
				log.Printf("Failed to create hint '%s': %v", hintMeta.Title, err)
				return err
			} else {
				log.Printf("Successfully created hint '%s' with IsActive=%v (ID: %d)", hintMeta.Title, hint.IsActive, hint.ID)

				// Verify by reading back from database
				var dbHint models.Hint
				if err := config.DB.First(&dbHint, hint.ID).Error; err == nil {
					log.Printf("DB verification for hint '%s': IsActive=%v", hintMeta.Title, dbHint.IsActive)
				}
			}
		}
	}

	return nil
}

func RetrieveFileContentFromMinio(path string) ([]byte, error) {
	const bucketName = "challenges"
	object, err := config.FS.GetObject(context.Background(), bucketName, path, minio.GetObjectOptions{})
	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer object.Close()

	content, err := io.ReadAll(object)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	log.Printf("File %s retrieved on MinIO", path)
	return content, nil
}

func DownloadChallengeContext(slug string, localDir string) error {
	const bucketName = "challenges"
	ctx := context.Background()

	opts := minio.ListObjectsOptions{
		Prefix:    slug + "/",
		Recursive: true,
	}

	for obj := range config.FS.ListObjects(ctx, bucketName, opts) {
		if obj.Err != nil {
			return obj.Err
		}
		localPath := filepath.Join(localDir, obj.Key[len(slug)+1:])
		if err := os.MkdirAll(filepath.Dir(localPath), 0755); err != nil {
			return err
		}
		reader, err := config.FS.GetObject(ctx, bucketName, obj.Key, minio.GetObjectOptions{})
		if err != nil {
			return err
		}
		defer reader.Close()

		outFile, err := os.Create(localPath)
		if err != nil {
			return err
		}
		if _, err := io.Copy(outFile, reader); err != nil {
			return err
		}
		outFile.Close()
	}
	return nil
}
