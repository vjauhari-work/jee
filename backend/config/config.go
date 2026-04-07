package config

import "os"

type Config struct {
	MongoURI      string
	MongoDBName   string
	JWTSecret     string
	AdminUsername string
	AdminPassword string
	AdminEmail    string
	Port          string
}

func Load() *Config {
	return &Config{
		MongoURI:      getEnv("MONGO_URI", "mongodb://localhost:27017/jeeprep"),
		MongoDBName:   getEnv("MONGO_DB_NAME", "jeeprep"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-me"),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@jeeprep.local"),
		Port:          getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
