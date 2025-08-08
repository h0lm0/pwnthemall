package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

func GetDecayFormulas(c *gin.Context) {
	var decayFormulas []models.DecayFormula
	if err := config.DB.Where("name != '' AND name IS NOT NULL").Find(&decayFormulas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Ajouter une option "None" pour désactiver le decay
	noneOption := models.DecayFormula{
		ID:   0,
		Name: "None (No Decay)",
		Type: "none",
	}

	// Insérer l'option "None" au début de la liste
	allFormulas := append([]models.DecayFormula{noneOption}, decayFormulas...)

	c.JSON(http.StatusOK, allFormulas)
}

func CreateDecayFormula(c *gin.Context) {
	var decayFormula models.DecayFormula
	if err := c.ShouldBindJSON(&decayFormula); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate that name is not empty
	if decayFormula.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Decay formula name cannot be empty"})
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

	// Validate that name is not empty
	if decayFormula.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Decay formula name cannot be empty"})
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
