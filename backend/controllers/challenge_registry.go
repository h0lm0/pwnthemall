package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/models"
)

type ChallengeInstanceHandler interface {
	Start(c *gin.Context, challenge *models.Challenge) error
	Stop(c *gin.Context, challenge *models.Challenge) error
	GetStatus(c *gin.Context, challenge *models.Challenge) error
}

var challengeHandlers = make(map[string]ChallengeInstanceHandler)

func RegisterChallengeHandler(challengeType string, handler ChallengeInstanceHandler) {
	challengeHandlers[challengeType] = handler
}

func GetChallengeHandler(challengeType string) (ChallengeInstanceHandler, bool) {
	handler, ok := challengeHandlers[challengeType]
	return handler, ok
}

type dockerChallengeHandler struct{}

func (h *dockerChallengeHandler) Start(c *gin.Context, challenge *models.Challenge) error {
	StartDockerChallengeInstance(c)
	return nil
}

func (h *dockerChallengeHandler) Stop(c *gin.Context, challenge *models.Challenge) error {
	StopDockerChallengeInstance(c)
	return nil
}

func (h *dockerChallengeHandler) GetStatus(c *gin.Context, challenge *models.Challenge) error {
	GetInstanceStatus(c)
	return nil
}

type composeChallengeHandler struct{}

func (h *composeChallengeHandler) Start(c *gin.Context, challenge *models.Challenge) error {
	StartComposeChallengeInstance(c)
	return nil
}

func (h *composeChallengeHandler) Stop(c *gin.Context, challenge *models.Challenge) error {
	StopComposeChallengeInstance(c)
	return nil
}

func (h *composeChallengeHandler) GetStatus(c *gin.Context, challenge *models.Challenge) error {
	GetInstanceStatus(c)
	return nil
}

func init() {
	RegisterChallengeHandler("docker", &dockerChallengeHandler{})
	RegisterChallengeHandler("compose", &composeChallengeHandler{})
}
