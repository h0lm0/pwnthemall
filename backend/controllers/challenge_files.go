package controllers

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

// FileMetadata represents downloadable file information
type FileMetadata struct {
	Name        string `json:"name"`
	Size        int64  `json:"size"`
	ContentType string `json:"contentType"`
}

// GetChallengeFiles returns metadata and pre-signed download URLs for challenge files
func GetChallengeFiles(c *gin.Context) {
	challengeID := c.Param("id")
	
	// Fetch challenge from database
	var challenge models.Challenge
	if err := config.DB.First(&challenge, challengeID).Error; err != nil {
		debug.Log("Challenge not found: %v", err)
		utils.NotFoundError(c, "challenge_not_found")
		return
	}

	// Check if challenge has files
	if len(challenge.Files) == 0 {
		c.JSON(http.StatusOK, []FileMetadata{})
		return
	}

	// Generate file metadata (without download URLs - client will use /download endpoint)
	files := make([]FileMetadata, 0, len(challenge.Files))
	bucketName := "challenges"

	for _, fileName := range challenge.Files {
		// Sanitize path
		cleanPath := filepath.Clean(fileName)
		if strings.HasPrefix(cleanPath, "..") || filepath.IsAbs(cleanPath) {
			debug.Log("Invalid file path skipped: %s", fileName)
			continue
		}

		// Construct object path
		objectPath := fmt.Sprintf("%s/%s", challenge.Slug, cleanPath)

		// Get file info from MinIO
		obj, err := config.FS.StatObject(context.Background(), bucketName, objectPath, minio.StatObjectOptions{})
		if err != nil {
			debug.Log("File not found in MinIO: %s, error: %v", objectPath, err)
			continue
		}

		// Determine content type
		contentType := obj.ContentType
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		files = append(files, FileMetadata{
			Name:        filepath.Base(fileName),
			Size:        obj.Size,
			ContentType: contentType,
		})
	}

	c.JSON(http.StatusOK, files)
}

func DownloadChallengeFile(c *gin.Context) {
	challengeID := c.Param("id")
	filename := c.Param("filename")

	// Fetch challenge from database
	var challenge models.Challenge
	if err := config.DB.First(&challenge, challengeID).Error; err != nil {
		debug.Log("Challenge not found: %v", err)
		utils.NotFoundError(c, "challenge_not_found")
		return
	}

	// Verify file is in challenge's file list
	fileFound := false
	var matchedFile string
	for _, f := range challenge.Files {
		if filepath.Base(f) == filename {
			fileFound = true
			matchedFile = f
			break
		}
	}

	if !fileFound {
		debug.Log("File %s not found in challenge %s file list", filename, challengeID)
		utils.NotFoundError(c, "file_not_found")
		return
	}

	// Sanitize path
	cleanPath := filepath.Clean(matchedFile)
	if strings.HasPrefix(cleanPath, "..") || filepath.IsAbs(cleanPath) {
		debug.Log("Invalid file path: %s", matchedFile)
		utils.BadRequestError(c, "invalid_file_path")
		return
	}

	// object path
	bucketName := "challenges"
	objectPath := fmt.Sprintf("%s/%s", challenge.Slug, cleanPath)

	// Get object from MinIO
	object, err := config.FS.GetObject(context.Background(), bucketName, objectPath, minio.GetObjectOptions{})
	if err != nil {
		debug.Log("Failed to get object from MinIO: %s, error: %v", objectPath, err)
		utils.InternalServerError(c, "file_download_failed")
		return
	}
	defer object.Close()

	// Get object info for content type and size
	objInfo, err := object.Stat()
	if err != nil {
		debug.Log("Failed to stat object: %s, error: %v", objectPath, err)
		utils.InternalServerError(c, "file_download_failed")
		return
	}

	// Set headers 
	contentType := objInfo.ContentType
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Type", contentType)
	c.Header("Content-Length", fmt.Sprintf("%d", objInfo.Size))

	if _, err := io.Copy(c.Writer, object); err != nil {
		debug.Log("Failed to stream file: %v", err)
		return
	}
}
