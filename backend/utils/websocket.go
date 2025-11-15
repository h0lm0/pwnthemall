package utils

import (
	"net/http"
	"sync"

	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/models"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now, can be restricted later
	},
}

// Client represents a connected WebSocket client
type Client struct {
	ID   uint
	Conn *websocket.Conn
	Hub  *Hub
	Send chan []byte
	mu   sync.Mutex
}

// Hub manages all WebSocket connections
type Hub struct {
	clients    map[uint]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// NewHub creates a new WebSocket hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[uint]*Client),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
			debug.Log("Client %d connected", client.ID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
			}
			h.mu.Unlock()
			debug.Log("Client %d disconnected", client.ID)

		case message := <-h.broadcast:
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client.ID)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID uint, message []byte) {
	h.mu.RLock()
	if client, exists := h.clients[userID]; exists {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.clients, userID)
		}
	}
	h.mu.RUnlock()
}

// SendToAll sends a message to all connected clients
func (h *Hub) SendToAll(message []byte) {
	h.broadcast <- message
}

// SendToAllExcept sends a message to all connected clients except the specified user
func (h *Hub) SendToAllExcept(message []byte, excludeUserID uint) {
	h.mu.RLock()
	for userID, client := range h.clients {
		if userID != excludeUserID {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.clients, userID)
			}
		}
	}
	h.mu.RUnlock()
}

// SendToTeam sends a message to all connected clients in a specific team
func (h *Hub) SendToTeam(teamID uint, message []byte) {
	// Get all users in the team from the database
	var userIDs []uint
	if err := config.DB.Model(&models.User{}).Where("team_id = ?", teamID).Pluck("id", &userIDs).Error; err != nil {
		debug.Log("Failed to get team members for team %d: %v", teamID, err)
		return
	}

	h.mu.RLock()
	for _, userID := range userIDs {
		if client, exists := h.clients[userID]; exists {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.clients, userID)
			}
		}
	}
	h.mu.RUnlock()
}

// SendToTeamExcept sends a message to all connected clients in a specific team except one user
func (h *Hub) SendToTeamExcept(teamID uint, excludeUserID uint, message []byte) {
	var userIDs []uint
	if err := config.DB.Model(&models.User{}).Where("team_id = ?", teamID).Pluck("id", &userIDs).Error; err != nil {
		debug.Log("Failed to get team members for team %d: %v", teamID, err)
		return
	}

	h.mu.RLock()
	for _, userID := range userIDs {
		if userID == excludeUserID {
			continue
		}
		if client, exists := h.clients[userID]; exists {
			select {
			case client.Send <- message:
			default:
				close(client.Send)
				delete(h.clients, userID)
			}
		}
	}
	h.mu.RUnlock()
}

// GetConnectedUsers returns a list of connected user IDs
func (h *Hub) GetConnectedUsers() []uint {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]uint, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// readPump reads messages from the WebSocket connection
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				debug.Log("error: %v", err)
			}
			break
		}
		debug.Log("Received message from client %d: %s", c.ID, string(message))
	}
}

// writePump writes messages to the WebSocket connection
func (c *Client) writePump() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.mu.Lock()
			err := c.Conn.WriteMessage(websocket.TextMessage, message)
			c.mu.Unlock()
			if err != nil {
				return
			}
		}
	}
}

// ServeWs handles WebSocket requests from clients
func ServeWs(hub *Hub, userID uint, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		debug.Log("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:   userID,
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	client.Hub.register <- client

	go client.writePump()
	go client.readPump()
}
