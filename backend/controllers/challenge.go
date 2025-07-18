package controllers

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"pwnthemall/config"
	"pwnthemall/models"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
)

func GetChallenges(c *gin.Context) {
	var challenges []models.Challenge
	result := config.DB.Find(&challenges)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, challenges)
}

func GetChallenge(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	result := config.DB.First(&challenge, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}
	c.JSON(http.StatusOK, challenge)
}

func GetChallengesByCategoryName(c *gin.Context) {
	categoryName := c.Param("category")

	var challenges []models.Challenge
	result := config.DB.Preload("ChallengeCategory").Joins("JOIN challenge_categories ON challenge_categories.id = challenges.challenge_category_id").
		Where("challenge_categories.name = ?", categoryName).
		Find(&challenges)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, challenges)
}

func CreateChallenge(c *gin.Context) {
	const maxSizePerFile = 1024 * 1024 * 256 // 256 MB

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read file"})
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".zip") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only .zip files are allowed"})
		return
	}

	buf := new(bytes.Buffer)
	if _, err := io.CopyN(buf, file, maxSizePerFile); err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Zip archive too large"})
		return
	}

	r, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid zip archive"})
		return
	}

	filename := header.Filename
	slug := strings.TrimSuffix(filename, filepath.Ext(filename))
	bucketName := "challenges"
	ctx := context.Background()

	prefix := ""
	if len(r.File) > 0 {
		first := r.File[0].Name
		if idx := strings.Index(first, "/"); idx != -1 {
			prefix = first[:idx+1]
		}
	}

	foundChallYml := false
	for _, f := range r.File {
		normalized := strings.TrimPrefix(f.Name, prefix)
		if strings.ToLower(normalized) == "chall.yml" {
			foundChallYml = true
			break
		}
	}

	if !foundChallYml {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing chall.yml in archive"})
		return
	}

	for _, f := range r.File {
		if f.FileInfo().IsDir() {
			continue
		}

		cleanPath := filepath.ToSlash(strings.TrimPrefix(f.Name, prefix))
		if strings.Contains(cleanPath, "..") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path in archive"})
			return
		}

		fc, err := f.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read zip content"})
			return
		}

		var fileBuf bytes.Buffer
		if _, err := io.CopyN(&fileBuf, fc, maxSizePerFile); err != nil && err != io.EOF {
			fc.Close()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("File %s is too large", f.Name)})
			return
		}
		fc.Close()

		if fileBuf.Len() == 0 {
			continue
		}

		objectPath := slug + "/" + cleanPath

		_, err = config.FS.PutObject(ctx, bucketName, objectPath, bytes.NewReader(fileBuf.Bytes()), int64(fileBuf.Len()), minio.PutObjectOptions{
			ContentType: http.DetectContentType(fileBuf.Bytes()),
		})

		if err != nil {
			log.Printf("Failed to upload %s: %v", objectPath, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to MinIO"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Challenge uploaded", "slug": slug})
}
