package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// JSONB 自定义JSONB类型
type JSONB map[string]interface{}

// Value 实现driver.Valuer接口
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan 实现sql.Scanner接口
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan JSONB type")
	}

	return json.Unmarshal(bytes, j)
}

// SegmentDefinition 分群定义
type SegmentDefinition struct {
	SegmentID      int64     `json:"segment_id" gorm:"primaryKey;autoIncrement"`
	ProjectID      int64     `json:"project_id" gorm:"not null"`
	SegmentName    string    `json:"segment_name" gorm:"not null"`
	GameID         string    `json:"game_id" gorm:"not null"`
	SegmentType    string    `json:"segment_type" gorm:"not null"` // static:静态, dynamic:动态, model:模型分群
	ConditionJSON  JSONB     `json:"condition_json" gorm:"type:jsonb;not null"`
	EstimatedCount int64     `json:"estimated_count" gorm:"default:0"`
	Status         string    `json:"status" gorm:"default:'draft'"` // draft:草稿, active:激活, inactive:停用
	Creator        string    `json:"creator" gorm:"not null"`
	CreateTime     time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime     time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (SegmentDefinition) TableName() string {
	return "segment_definition"
}

// SegmentPlayerRelation 分群玩家关联
type SegmentPlayerRelation struct {
	ID         int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID   int64     `json:"project_id" gorm:"not null"`
	SegmentID  int64     `json:"segment_id" gorm:"not null"`
	PlayerID   int64     `json:"player_id" gorm:"not null"`
	GameID     string    `json:"game_id" gorm:"not null"`
	JoinTime   time.Time `json:"join_time" gorm:"autoCreateTime"`
	LeaveTime  time.Time `json:"leave_time"`
	IsActive   int       `json:"is_active" gorm:"default:1"` // 1:活跃, 0:不活跃
}

// TableName 指定表名
func (SegmentPlayerRelation) TableName() string {
	return "segment_player_relation"
}
