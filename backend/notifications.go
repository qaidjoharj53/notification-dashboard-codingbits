package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Notification struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Title     string             `bson:"title" json:"title"`
	Message   string             `bson:"message" json:"message"`
	Category  string             `bson:"category" json:"category"`
	Read      bool               `bson:"read" json:"read"`
	Timestamp time.Time          `bson:"timestamp" json:"timestamp"`
	UserID    primitive.ObjectID `bson:"userId" json:"userId"`
}

func getNotifications(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	userID, ok := session.Values["userId"].(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	objectID, _ := primitive.ObjectIDFromHex(userID)

	collection := mongoClient.Database("notificationDB").Collection("notifications")
	cursor, err := collection.Find(context.Background(), bson.M{"userId": objectID}, options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}}))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())

	var notifications []Notification
	if err = cursor.All(context.Background(), &notifications); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(notifications)
}

func addNotification(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	userID, ok := session.Values["userId"].(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var notification Notification
	json.NewDecoder(r.Body).Decode(&notification)
	notification.Timestamp = time.Now()
	notification.Read = false
	notification.UserID, _ = primitive.ObjectIDFromHex(userID)

	collection := mongoClient.Database("notificationDB").Collection("notifications")
	result, err := collection.InsertOne(context.Background(), notification)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	notification.ID = result.InsertedID.(primitive.ObjectID)
	json.NewEncoder(w).Encode(notification)

	// Broadcast new notification to WebSocket clients
	broadcastNotification(notification)
}

func markNotification(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	userID, ok := session.Values["userId"].(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	id, _ := primitive.ObjectIDFromHex(vars["id"])

	var updateData struct {
		Read bool `json:"read"`
	}
	json.NewDecoder(r.Body).Decode(&updateData)

	collection := mongoClient.Database("notificationDB").Collection("notifications")
	filter := bson.M{"_id": id, "userId": userID}
	update := bson.M{"$set": bson.M{"read": updateData.Read}}
	result := collection.FindOneAndUpdate(context.Background(), filter, update, options.FindOneAndUpdate().SetReturnDocument(options.After))

	var notification Notification
	if err := result.Decode(&notification); err != nil {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(notification)

	// Broadcast updated notification to WebSocket clients
	broadcastNotification(notification)
}

func deleteNotification(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	userID, ok := session.Values["userId"].(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	id, _ := primitive.ObjectIDFromHex(vars["id"])

	collection := mongoClient.Database("notificationDB").Collection("notifications")
	filter := bson.M{"_id": id, "userId": userID}
	result, err := collection.DeleteOne(context.Background(), filter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Notification not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Notification deleted"})

	// Broadcast deletion to WebSocket clients
	broadcastDeletion(id.Hex())
}

// Add this new function to the existing file
func sendNotificationToAllUsers(w http.ResponseWriter, r *http.Request) {
	// Check if the user is an admin
	session, _ := store.Get(r, "session-name")
	userID, ok := session.Values["userId"].(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user User
	collection := mongoClient.Database("notificationDB").Collection("users")
	err := collection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
	if err != nil || user.Role != "admin" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var notification Notification
	err = json.NewDecoder(r.Body).Decode(&notification)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	notification.Timestamp = time.Now()
	notification.Read = false

	// Get all user IDs
	userCollection := mongoClient.Database("notificationDB").Collection("users")
	userCursor, err := userCollection.Find(context.Background(), bson.M{})
	if err != nil {
		http.Error(w, "Error fetching users", http.StatusInternalServerError)
		return
	}
	defer userCursor.Close(context.Background())

	var users []User
	if err = userCursor.All(context.Background(), &users); err != nil {
		http.Error(w, "Error processing users", http.StatusInternalServerError)
		return
	}

	notificationCollection := mongoClient.Database("notificationDB").Collection("notifications")
	var insertedNotifications []interface{}

	for _, user := range users {
		notificationCopy := notification
		notificationCopy.UserID = user.ID
		insertedNotifications = append(insertedNotifications, notificationCopy)
	}

	_, err = notificationCollection.InsertMany(context.Background(), insertedNotifications)
	if err != nil {
		http.Error(w, "Error sending notifications", http.StatusInternalServerError)
		return
	}

	// Broadcast new notification to all connected WebSocket clients
	broadcastNotificationToAll(notification)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Notification sent to all users"})
}

// Add this new function to broadcast to all WebSocket clients
func broadcastNotificationToAll(notification Notification) {
	clientsMu.Lock()
	defer clientsMu.Unlock()

	for client := range clients {
		err := client.WriteJSON(map[string]interface{}{
			"type":         "newNotification",
			"notification": notification,
		})
		if err != nil {
			log.Printf("Error broadcasting notification: %v", err)
			client.Close()
			delete(clients, client)
		}
	}
}

