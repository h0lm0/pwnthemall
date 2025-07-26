package utils

import (
	"bytes"
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"pwnthemall/config"
	"pwnthemall/meta"
	"pwnthemall/models"

	"github.com/minio/minio-go/v7"
	"gopkg.in/yaml.v2"
	"gorm.io/gorm"
)

func SyncChallengesFromMinIO(ctx context.Context, key string) error {
	// Extract the bucket name and the object key
	const bucketName = "challenges"
	parts := strings.SplitN(key, "/", 2)
	if len(parts) < 2 {
		log.Printf("Invalid key format: %s", key)
		return nil
	}

	objectKey := parts[1]

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

	// Unmarshal the YAML content and update the database
	var metaData meta.BaseChallengeMetadata
	if err := yaml.Unmarshal(buf.Bytes(), &metaData); err != nil {
		log.Printf("Invalid YAML for %s: %v", objectKey, err)
		return err
	}

	// Update or create the challenge in the database
	if err := updateOrCreateChallengeInDB(metaData, strings.Split(objectKey, "/")[0]); err != nil {
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

func updateOrCreateChallengeInDB(metaData meta.BaseChallengeMetadata, slug string) error {
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

	var challenge models.Challenge
	if err := config.DB.Where("slug = ?", slug).First(&challenge).Error; err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	// Remplir les champs du challenge
	challenge.Slug = slug
	challenge.Name = metaData.Name
	challenge.Description = metaData.Description
	challenge.ChallengeDifficultyID = cDifficulty.ID
	challenge.ChallengeCategoryID = cCategory.ID
	challenge.ChallengeTypeID = cType.ID
	challenge.Author = metaData.Author
	challenge.Hidden = metaData.Hidden
	challenge.Points = metaData.Points

	if err := config.DB.Save(&challenge).Error; err != nil {
		return err
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
