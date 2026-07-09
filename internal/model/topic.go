package model

import "time"

// TopicDefinition topic 定义
type TopicDefinition struct {
	ID          int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID   int64     `json:"project_id" gorm:"not null"`
	TopicKey    string    `json:"topic_key" gorm:"not null"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	SubCount    int64     `json:"sub_count" gorm:"-"` // 订阅人数，查询时聚合填入
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (TopicDefinition) TableName() string {
	return "topic_definition"
}

// TopicSubscription 用户-topic 订阅关系
type TopicSubscription struct {
	ID               int64      `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID        int64      `json:"project_id" gorm:"not null"`
	TopicID          int64      `json:"topic_id" gorm:"not null"`
	AccountID        string     `json:"account_id" gorm:"not null"`
	SubscribedAt     time.Time  `json:"subscribed_at" gorm:"autoCreateTime"`
	UnsubscribedAt   *time.Time `json:"unsubscribed_at"`
	IsActive         bool       `json:"is_active" gorm:"default:true"`
}

func (TopicSubscription) TableName() string {
	return "topic_subscription"
}
