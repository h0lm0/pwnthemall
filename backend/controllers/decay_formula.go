package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

func GetDecayFormulas(c *gin.Context) {
	var decayFormulas []models.DecayFormula
	if err := config.DB.Find(&decayFormulas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, decayFormulas)
}

func CreateDecayFormula(c *gin.Context) {
	var decayFormula models.DecayFormula
	if err := c.ShouldBindJSON(&decayFormula); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Create(&decayFormula).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, decayFormula)
}

func UpdateDecayFormula(c *gin.Context) {
	var decayFormula models.DecayFormula
	id := c.Param("id")

	if err := config.DB.First(&decayFormula, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Decay formula not found"})
		return
	}

	if err := c.ShouldBindJSON(&decayFormula); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB.Save(&decayFormula).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, decayFormula)
}

func DeleteDecayFormula(c *gin.Context) {
	id := c.Param("id")
	
	if err := config.DB.Delete(&models.DecayFormula{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Decay formula deleted successfully"})
}
