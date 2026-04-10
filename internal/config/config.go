package config

import (
	"os"
	"strconv"

	"github.com/sirupsen/logrus"
)

// Config 应用配置结构体
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	FCM      FCMConfig
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Port int
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	DBName   string
	SSLMode  string
}

// RedisConfig Redis配置
type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

// FCMConfig FCM配置
type FCMConfig struct {
	ProjectID string
	APIKey    string
}

// LoadConfig 加载配置
func LoadConfig() (*Config, error) {
	cfg := &Config{}

	// 加载服务器配置
	serverPort, err := strconv.Atoi(getEnv("SERVER_PORT", "8080"))
	if err != nil {
		return nil, err
	}
	cfg.Server = ServerConfig{
		Port: serverPort,
	}

	// 加载数据库配置
	dbPort, err := strconv.Atoi(getEnv("DB_PORT", "5432"))
	if err != nil {
		return nil, err
	}
	cfg.Database = DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     dbPort,
		Username: getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_NAME", "game_marketing"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	// 加载Redis配置
	redisPort, err := strconv.Atoi(getEnv("REDIS_PORT", "6379"))
	if err != nil {
		return nil, err
	}
	redisDB, err := strconv.Atoi(getEnv("REDIS_DB", "0"))
	if err != nil {
		return nil, err
	}
	cfg.Redis = RedisConfig{
		Host:     getEnv("REDIS_HOST", "localhost"),
		Port:     redisPort,
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       redisDB,
	}

	// 加载FCM配置
	cfg.FCM = FCMConfig{
		ProjectID: getEnv("FCM_PROJECT_ID", ""),
		APIKey:    getEnv("FCM_API_KEY", ""),
	}

	logrus.Info("Configuration loaded successfully")
	return cfg, nil
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
