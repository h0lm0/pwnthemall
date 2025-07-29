package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/dto"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
)

func GetInstances(c *gin.Context) {
	var instances []models.Instance
	result := config.DB.Find(&instances)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	var instanceDTOs []dto.InstanceDTO
	for _, instance := range instances {
		var instanceDTO dto.InstanceDTO
		copier.Copy(&instanceDTO, &instance)
		instanceDTOs = append(instanceDTOs, instanceDTO)
	}

	c.JSON(http.StatusOK, instanceDTOs)
}

func GetInstance(c *gin.Context) {
	var instance models.Instance
	id := c.Param("id")
	result := config.DB.First(&instance, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
		return
	}

	var instanceDTO dto.InstanceDTO
	copier.Copy(&instanceDTO, &instance)

	c.JSON(http.StatusOK, instanceDTO)
}
