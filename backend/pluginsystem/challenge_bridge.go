package pluginsystem

import (
    "encoding/json"
    "fmt"

    "github.com/gin-gonic/gin"
    "github.com/pwnthemall/pwnthemall/backend/controllers"
    "github.com/pwnthemall/pwnthemall/backend/models"
    "github.com/pwnthemall/pwnthemall/backend/shared"
)

// PluginChallengeHandler adapte un handler de plugin pour le registry du backend
type PluginChallengeHandler struct {
    plugin        shared.Plugin
    challengeType string
}

func (h *PluginChallengeHandler) Start(c *gin.Context, challenge *models.Challenge) error {
    return h.executeAction("start", c, challenge)
}

func (h *PluginChallengeHandler) Stop(c *gin.Context, challenge *models.Challenge) error {
    return h.executeAction("stop", c, challenge)
}

func (h *PluginChallengeHandler) GetStatus(c *gin.Context, challenge *models.Challenge) error {
    return h.executeAction("status", c, challenge)
}

func (h *PluginChallengeHandler) executeAction(action string, c *gin.Context, challenge *models.Challenge) error {
    // Convertir le challenge en données sérialisables
    challengeData := map[string]interface{}{
        "id":              challenge.ID,
        "slug":           challenge.Slug,
        "challenge_type":  challenge.ChallengeType.Name,
        "action":          action,
    }

    body, _ := json.Marshal(challengeData)

    requestData := shared.RequestData{
        Method:  "POST",
        Path:    fmt.Sprintf("/internal/challenge/%s", action),
        Headers: c.Request.Header,
        Body:    body,
        Query:   c.Request.URL.Query(),
    }

    if rpcPlugin, ok := h.plugin.(*shared.PluginRPC); ok {
        handlerName := fmt.Sprintf("ChallengeInstance%s", action)
        response, err := rpcPlugin.HandleRequest(handlerName, requestData)
        if err != nil {
            return err
        }

        for key, value := range response.Headers {
            c.Header(key, value)
        }
        c.Data(response.StatusCode, "application/json", response.Body)
        return nil
    }

    return fmt.Errorf("plugin does not implement RPC interface")
}

func RegisterPluginChallengeHandler(plugin shared.Plugin, challengeType string) {
    handler := &PluginChallengeHandler{
        plugin:        plugin,
        challengeType: challengeType,
    }
    controllers.RegisterChallengeHandler(challengeType, handler)
}
