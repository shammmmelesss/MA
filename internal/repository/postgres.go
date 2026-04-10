package repository

import (
	"fmt"

	"github.com/game-marketing-platform/internal/config"
	"github.com/game-marketing-platform/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// PostgresDB PostgreSQL数据库连接
type PostgresDB struct {
	db *gorm.DB
}

// NewPostgresDB 创建PostgreSQL数据库连接
func NewPostgresDB(cfg config.DatabaseConfig) (*PostgresDB, error) {
	// 使用URL格式的DSN
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.Username, cfg.Password, cfg.Host, cfg.Port, cfg.DBName, cfg.SSLMode)
	// DSN logged without credentials for security
	fmt.Printf("DSN: postgres://%s:****@%s:%d/%s?sslmode=%s\n",
		cfg.Username, cfg.Host, cfg.Port, cfg.DBName, cfg.SSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	// 自动迁移数据库表
	err = db.AutoMigrate(
		&model.PlayerBase{},
		&model.TagDefinition{},
		&model.PlayerTag{},
		&model.SegmentDefinition{},
		&model.SegmentPlayerRelation{},
		&model.Campaign{},
		&model.CampaignConfig{},
		&model.CampaignChannel{},
		&model.CampaignContent{},
		&model.CampaignApproval{},
		&model.CampaignExecution{},
		&model.ProjectSpace{},
		&model.ProjectMember{},
		&model.AppInfo{},
		&model.AppAuth{},
		&model.AppChannelConfig{},
		&model.DeviceInfo{},
		&model.AuthLog{},
		&model.PushTask{},
	)
	if err != nil {
		return nil, err
	}

	return &PostgresDB{db: db}, nil
}

// GetDB 获取数据库连接
func (p *PostgresDB) GetDB() *gorm.DB {
	return p.db
}
