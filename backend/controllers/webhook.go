package controllers

import (
	"context"
	"log"
	"strings"

	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
)

func MinioWebhook(c *gin.Context) {
	var event map[string]interface{}
	if err := c.BindJSON(&event); err != nil {
		utils.BadRequestError(c, "invalid JSON payload")
		return
	}

	if key, ok := event["Key"].(string); ok {
		if strings.Contains(key, "/chall.yml") {
			go func() {
				ctx := context.Background()
				if err := utils.SyncChallengesFromMinIO(ctx, key, UpdatesHub); err != nil {
					log.Printf("MinIO sync error: %v", err)
				}
			}()
		}
	} else {
		log.Printf("Key not found or not a string")
	}

	utils.OKResponse(c, gin.H{"status": "challenge sync started"})
}
