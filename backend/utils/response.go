package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse sends a JSON error response with the given status code
func ErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{"error": message})
}

// SuccessResponse sends a JSON success response with data
func SuccessResponse(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, data)
}

// BadRequestError sends a 400 Bad Request error
func BadRequestError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusBadRequest, message)
}

// NotFoundError sends a 404 Not Found error
func NotFoundError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusNotFound, message)
}

// InternalServerError sends a 500 Internal Server Error
func InternalServerError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusInternalServerError, message)
}

// UnauthorizedError sends a 401 Unauthorized error
func UnauthorizedError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusUnauthorized, message)
}

// ForbiddenError sends a 403 Forbidden error
func ForbiddenError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusForbidden, message)
}

// ConflictError sends a 409 Conflict error
func ConflictError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusConflict, message)
}

// OKResponse sends a 200 OK response with data
func OKResponse(c *gin.Context, data interface{}) {
	SuccessResponse(c, http.StatusOK, data)
}

// CreatedResponse sends a 201 Created response with data
func CreatedResponse(c *gin.Context, data interface{}) {
	SuccessResponse(c, http.StatusCreated, data)
}

// NoContentResponse sends a 204 No Content response
func NoContentResponse(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// ServiceUnavailableError sends a 503 Service Unavailable error
func ServiceUnavailableError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusServiceUnavailable, message)
}

// NotImplementedError sends a 501 Not Implemented error
func NotImplementedError(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusNotImplemented, message)
}
