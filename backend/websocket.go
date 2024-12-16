package main

import (
	// "encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	clients   = make(map[*websocket.Conn]bool)
	clientsMu sync.Mutex
)

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	clientsMu.Lock()
	clients[conn] = true
	clientsMu.Unlock()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			clientsMu.Lock()
			delete(clients, conn)
			clientsMu.Unlock()
			break
		}
	}
}

func broadcastNotification(notification Notification) {
	clientsMu.Lock()
	defer clientsMu.Unlock()

	for client := range clients {
		err := client.WriteJSON(map[string]interface{}{
			"type":         "notification",
			"notification": notification,
		})
		if err != nil {
			log.Printf("Error broadcasting notification: %v", err)
			client.Close()
			delete(clients, client)
		}
	}
}

func broadcastDeletion(id string) {
	clientsMu.Lock()
	defer clientsMu.Unlock()

	for client := range clients {
		err := client.WriteJSON(map[string]interface{}{
			"type": "deletion",
			"id":   id,
		})
		if err != nil {
			log.Printf("Error broadcasting deletion: %v", err)
			client.Close()
			delete(clients, client)
		}
	}
}

