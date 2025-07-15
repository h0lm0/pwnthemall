package utils

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"strings"

	"pwnthemall/config"
	"pwnthemall/meta"
	"pwnthemall/models"

	"github.com/goccy/go-yaml"
	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
)

func SyncChallengesFromMinIO(ctx context.Context) error {
	const bucketName = "challenges"
	log.Printf("SyncChallengesFromMinIO begin")
	objCh := config.FS.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Prefix:    "",
		Recursive: true,
	})
	log.Print(objCh)

	for obj := range objCh {
		if obj.Err != nil || !strings.HasSuffix(obj.Key, "chall.yml") {
			continue
		}

		parts := strings.Split(obj.Key, "/")
		if len(parts) < 2 {
			continue
		}
		slug := parts[0]

		objReader, err := config.FS.GetObject(ctx, bucketName, obj.Key, minio.GetObjectOptions{})
		if err != nil {
			fmt.Printf("Erreur téléchargement %s: %v\n", obj.Key, err)
			continue
		}
		buf := new(bytes.Buffer)
		_, err = buf.ReadFrom(objReader)
		if err != nil {
			fmt.Printf("Erreur lecture %s: %v\n", obj.Key, err)
			continue
		}

		var metaData meta.ChallengeMetadata
		if err := yaml.Unmarshal(buf.Bytes(), &metaData); err != nil {
			fmt.Printf("YAML invalide pour %s: %v\n", obj.Key, err)
			continue
		}

		var category models.ChallengeCategory
		if err := config.DB.FirstOrCreate(&category, models.ChallengeCategory{Name: metaData.Category}).Error; err != nil {
			return err
		}

		var challenge models.Challenge
		if err := config.DB.Where("slug = ?", slug).First(&challenge).Error; err != nil && err != gorm.ErrRecordNotFound {
			return err
		}

		challenge.Slug = slug
		challenge.Name = metaData.Name
		challenge.Description = metaData.Description
		challenge.Difficulty = metaData.Difficulty
		challenge.ChallengeCategoryID = category.ID

		if err := config.DB.Save(&challenge).Error; err != nil {
			return err
		}

		fmt.Printf("Synchro %s → DB (%s)\n", slug, challenge.Name)
	}

	return nil
}
