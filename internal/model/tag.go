package model

import "time"

// TagDefinition 标签定义
type TagDefinition struct {
	TagCode     string    `json:"tag_code" gorm:"primaryKey"`
	ProjectID   int64     `json:"project_id" gorm:"not null"`
	TagName     string    `json:"tag_name" gorm:"not null"`
	TagType     string    `json:"tag_type" gorm:"not null"` // base:基础, behavior:行为, trade:交易, game:游戏专属, custom:自定义
	DataType    string    `json:"data_type" gorm:"not null"` // string, number, boolean, datetime
	Description string    `json:"description"`
	IsSystem    int       `json:"is_system" gorm:"default:1"` // 1:是, 0:否
	IsActive    int       `json:"is_active" gorm:"default:1"` // 1:启用, 0:禁用
	CreateTime  time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime  time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (TagDefinition) TableName() string {
	return "tag_definition"
}

// PlayerTag 玩家标签关联
type PlayerTag struct {
	ID         int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID   int64     `json:"project_id" gorm:"not null"`
	PlayerID   int64     `json:"player_id" gorm:"not null"`
	TagCode    string    `json:"tag_code" gorm:"not null"`
	TagValue   string    `json:"tag_value" gorm:"not null"`
	TagType    string    `json:"tag_type" gorm:"not null"`
	GameID     string    `json:"game_id" gorm:"not null"`
	ExpireTime time.Time `json:"expire_time"`
	CreateTime time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (PlayerTag) TableName() string {
	return "player_tag"
}
