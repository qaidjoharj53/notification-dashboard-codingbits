package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Username string             `bson:"username" json:"username"`
	Password string             `bson:"password" json:"-"`
	Role     string             `bson:"role" json:"role"`
}

func register(w http.ResponseWriter, r *http.Request) {
	var user User
	json.NewDecoder(r.Body).Decode(&user)

	collection := mongoClient.Database("notificationDB").Collection("users")
	existingUser := collection.FindOne(context.Background(), bson.M{"username": user.Username})
	if existingUser.Err() == nil {
		http.Error(w, "Username already exists", http.StatusBadRequest)
		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	user.Password = string(hashedPassword)
	user.Role = "user" // Set default role to "user"

	result, err := collection.InsertOne(context.Background(), user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user.ID = result.InsertedID.(primitive.ObjectID)
	user.Password = ""

	session, _ := store.Get(r, "session-name")
	session.Values["userId"] = user.ID.Hex()
	session.Save(r, w)

	json.NewEncoder(w).Encode(user)
}

func login(w http.ResponseWriter, r *http.Request) {
	var loginData struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&loginData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	collection := mongoClient.Database("notificationDB").Collection("users")
	var user User
	err := collection.FindOne(context.Background(), bson.M{"username": loginData.Username}).Decode(&user)
	if err != nil {
		log.Printf("User not found: %v", err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginData.Password)); err != nil {
		log.Printf("Password mismatch: %v", err)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	session, _ := store.Get(r, "session-name")
	session.Values["userId"] = user.ID.Hex()
	if err := session.Save(r, w); err != nil {
		log.Printf("Failed to save session: %v", err)
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	user.Password = "" // Don't send the password back to the client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}



func logout(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session-name")
	session.Values["userId"] = nil
	session.Options.MaxAge = -1
	session.Save(r, w)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

