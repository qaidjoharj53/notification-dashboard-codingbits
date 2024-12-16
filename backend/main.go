package main

import (
	"context"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rbcervilla/redisstore/v8"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	mongoClient *mongo.Client
	redisClient *redis.Client
	store       *redisstore.RedisStore
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// MongoDB connection
	mongoURI := os.Getenv("MONGODB_URI")
	clientOptions := options.Client().ApplyURI(mongoURI)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	mongoClient, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal(err)
	}
	defer mongoClient.Disconnect(ctx)
    log.Println("Connected to MongoDB")

	// Redis connection
	redisURL, err := url.Parse(os.Getenv("REDIS_URL"))
	if err != nil {
		log.Fatal("Error parsing Redis URL:", err)
	}

	password, _ := redisURL.User.Password()
	redisClient = redis.NewClient(&redis.Options{
		Addr:     redisURL.Host,
		Password: password,
		DB:       0, // Use default DB
	})

	// Test Redis connection
	_, err = redisClient.Ping(context.Background()).Result()
	if err != nil {
		log.Fatal("Error connecting to Redis:", err)
	}
    log.Println("Connected to Redis")

	// Session store
	store, err = redisstore.NewRedisStore(context.Background(), redisClient)
	if err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/api/notifications", authMiddleware(getNotifications)).Methods("GET")
	r.HandleFunc("/api/notifications", authMiddleware(addNotification)).Methods("POST")
	r.HandleFunc("/api/notifications/{id}", authMiddleware(markNotification)).Methods("PATCH")
	r.HandleFunc("/api/notifications/{id}", authMiddleware(deleteNotification)).Methods("DELETE")
	r.HandleFunc("/api/notifications/sendToAll", authMiddleware(sendNotificationToAllUsers)).Methods("POST")
	r.HandleFunc("/api/auth/register", register).Methods("POST")
	r.HandleFunc("/api/auth/login", login).Methods("POST")
	r.HandleFunc("/api/auth/logout", logout).Methods("POST")
	r.HandleFunc("/ws", handleWebSocketConnection)

	// CORS middleware
	r.Use(corsMiddleware)

	// Error handling middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					log.Printf("Panic: %v", err)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	})

	log.Println("Server is running on port 5000")
	log.Fatal(http.ListenAndServe(":5000", r))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", os.Getenv("FRONTEND_URL"))
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}



func handleWebSocketConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}
		if err := conn.WriteMessage(messageType, p); err != nil {
			log.Println(err)
			return
		}
	}
}

