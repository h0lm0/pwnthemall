package controllers

import (
	"context"
	"log"
	"net/http"
	"strings"

	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
)

func MinioWebhook(c *gin.Context) {
	var event map[string]interface{}
	if err := c.BindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON payload"})
		return
	}

	if key, ok := event["Key"].(string); ok {
		if strings.Contains(key, "/chall.yml") {
			go func() {
				ctx := context.Background()
				if err := utils.SyncChallengesFromMinIO(ctx, key); err != nil {
					log.Printf("MinIO sync error: %v", err)
				}
			}()
		}
	} else {
		log.Printf("Key not found or not a string")
	}

	c.JSON(http.StatusOK, gin.H{"status": "challenge sync started"})
}
