package model

import "time"

type UserSubscription struct {
	ID         int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID  int64     `json:"project_id" gorm:"not null"`
	Name       string    `json:"name" gorm:"not null"`
	Status     string    `json:"status" gorm:"default:'enabled'"` // enabled / disabled
	Type       string    `json:"type" gorm:"not null"`            // sql / api / offline
	TaskCycle  string    `json:"task_cycle"`                      // daily / weekly / monthly
	TaskTime   string    `json:"task_time"`                       // 执行时间，如 "08:00"
	SQLContent string    `json:"sql_content" gorm:"column:sql_content"`
	APIURL     string    `json:"api_url" gorm:"column:api_url"`
	CreatedBy  string    `json:"created_by"`
	UpdatedBy  string    `json:"updated_by"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (UserSubscription) TableName() string { return "user_subscription" }
