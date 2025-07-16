package controllers

import (
	"log"
	"net/http"
	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
)

func MinioWebhook(c *gin.Context) {
	var event map[string]interface{}
	log.Print(&c.Request)
	log.Print(&c.Request.Body)
	if err := c.BindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON payload"})
		return
	}

	go func() {
		if err := utils.SyncChallengesFromMinIO(c.Request.Context()); err != nil {
			log.Printf("MinIO sync error: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"status": "challenge sync started"})
}
