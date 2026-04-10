package model

import (
	"time"
)

// PushTask 推送任务
type PushTask struct {
	TaskID            int64     `json:"task_id" gorm:"primaryKey;autoIncrement"`
	ProjectID         int64     `json:"project_id" gorm:"not null"`
	TaskName          string    `json:"task_name" gorm:"not null"`
	PushType          string    `json:"push_type" gorm:"not null"`
	Status            string    `json:"status" gorm:"default:'draft'"`
	PushTimingConfig  JSONB     `json:"push_timing_config" gorm:"type:jsonb"`
	TargetUserConfig  JSONB     `json:"target_user_config" gorm:"type:jsonb"`
	PushContentConfig JSONB     `json:"push_content_config" gorm:"type:jsonb"`
	Creator           string    `json:"creator" gorm:"not null"`
	CreateTime        time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime        time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (PushTask) TableName() string {
	return "push_task"
}
