package main

import (
	"context"
	"net/http"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, "session-name")
		userID, ok := session.Values["userId"].(string)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		objectID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "userId", objectID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

