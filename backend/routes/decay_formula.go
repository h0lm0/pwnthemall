package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterDecayFormulaRoutes(router *gin.Engine) {
	decayFormulas := router.Group("/decay-formulas")
	{
		decayFormulas.GET("", controllers.GetDecayFormulas)
		decayFormulas.POST("", middleware.AuthRequired(true), middleware.CheckPolicy("/api/decay-formulas", "write"), controllers.CreateDecayFormula)
		decayFormulas.PUT("/:id", middleware.AuthRequired(true), middleware.CheckPolicy("/api/decay-formulas/:id", "write"), controllers.UpdateDecayFormula)
		decayFormulas.DELETE("/:id", middleware.AuthRequired(true), middleware.CheckPolicy("/api/decay-formulas/:id", "write"), controllers.DeleteDecayFormula)
	}
}
