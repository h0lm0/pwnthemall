package shared

// ChallengeData contient les données d'un challenge à traiter
type ChallengeData struct {
	ID              uint
	Slug           string
	ChallengeType   string
	ChallengeConfig map[string]interface{}
}

// ChallengeHandlerFunc est une fonction qui gère un challenge
type ChallengeHandlerFunc func(action string, data ChallengeData, request RequestData) (ResponseData, error)

// ChallengeHandlerRegistry stocke les handlers enregistrés
var ChallengeHandlerRegistry = make(map[string]ChallengeHandlerFunc)

// RegisterChallengeHandler enregistre un handler pour un type de challenge
func RegisterChallengeHandler(challengeType string, handler ChallengeHandlerFunc) {
	ChallengeHandlerRegistry[challengeType] = handler
}
