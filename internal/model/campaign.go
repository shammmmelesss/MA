package model

import (
	"time"
)

// CampaignStatus 活动状态
type CampaignStatus string

// 活动状态枚举
const (
	CampaignStatusDraft     CampaignStatus = "draft"     // 草稿
	CampaignStatusPending   CampaignStatus = "pending"   // 待审批
	CampaignStatusApproved  CampaignStatus = "approved"  // 已审批
	CampaignStatusRunning   CampaignStatus = "running"   // 运行中
	CampaignStatusPaused    CampaignStatus = "paused"    // 已暂停
	CampaignStatusCompleted CampaignStatus = "completed" // 已完成
	CampaignStatusCanceled  CampaignStatus = "canceled"  // 已取消
)

// CampaignType 活动类型
type CampaignType string

// 活动类型枚举
const (
	CampaignTypeInstant   CampaignType = "instant"   // 即时活动
	CampaignTypeScheduled CampaignType = "scheduled" // 定时活动
	CampaignTypeTriggered  CampaignType = "triggered"  // 触发活动
	CampaignTypeABTest    CampaignType = "ab_test"    // A/B测试活动
)

// Campaign 营销活动定义
type Campaign struct {
	CampaignID      int64          `json:"campaign_id" gorm:"primaryKey;autoIncrement"`
	ProjectID       int64          `json:"project_id" gorm:"not null"`
	CampaignName    string         `json:"campaign_name" gorm:"not null"`
	GameID          string         `json:"game_id" gorm:"not null"`
	CampaignType    CampaignType   `json:"campaign_type" gorm:"not null"`
	Status          CampaignStatus `json:"status" gorm:"default:'draft'"`
	Priority        int            `json:"priority" gorm:"default:5"` // 1-10，10最高
	Description     string         `json:"description"`
	Creator         string         `json:"creator" gorm:"not null"`
	TargetSegmentIDs []int64        `json:"target_segment_ids" gorm:"type:integer[]"` // 目标人群分群ID列表
	StartTime       time.Time      `json:"start_time"`
	EndTime         time.Time      `json:"end_time"`
	CreateTime      time.Time      `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime      time.Time      `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Campaign) TableName() string {
	return "campaign"
}

// CampaignConfig 活动配置
type CampaignConfig struct {
	ConfigID     int64     `json:"config_id" gorm:"primaryKey;autoIncrement"`
	CampaignID   int64     `json:"campaign_id" gorm:"not null"`
	ConfigType   string    `json:"config_type" gorm:"not null"` // schedule, trigger, ab_test
	ConfigJSON   JSONB     `json:"config_json" gorm:"type:jsonb;not null"`
	CreateTime   time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime   time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (CampaignConfig) TableName() string {
	return "campaign_config"
}

// CampaignChannel 活动渠道配置
type CampaignChannel struct {
	ChannelID    int64     `json:"channel_id" gorm:"primaryKey;autoIncrement"`
	CampaignID   int64     `json:"campaign_id" gorm:"not null"`
	ChannelType  string    `json:"channel_type" gorm:"not null"` // fcm, sms, in_app, wechat
	ChannelName  string    `json:"channel_name" gorm:"not null"`
	IsPrimary    bool      `json:"is_primary" gorm:"default:false"`
	ContentID    int64     `json:"content_id" gorm:"not null"`
	ConfigJSON   JSONB     `json:"config_json" gorm:"type:jsonb"`
	CreateTime   time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime   time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (CampaignChannel) TableName() string {
	return "campaign_channel"
}

// CampaignContent 活动内容
type CampaignContent struct {
	ContentID    int64     `json:"content_id" gorm:"primaryKey;autoIncrement"`
	CampaignID   int64     `json:"campaign_id" gorm:"not null"`
	ContentName  string    `json:"content_name" gorm:"not null"`
	ContentTitle string    `json:"content_title"`
	ContentBody  string    `json:"content_body" gorm:"type:text"`
	ContentType  string    `json:"content_type" gorm:"not null"` // text, rich_text, image, video
	Variables    JSONB     `json:"variables" gorm:"type:jsonb"` // 变量定义
	CreateTime   time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime   time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (CampaignContent) TableName() string {
	return "campaign_content"
}

// CampaignApproval 活动审批
type CampaignApproval struct {
	ApprovalID    int64      `json:"approval_id" gorm:"primaryKey;autoIncrement"`
	CampaignID    int64      `json:"campaign_id" gorm:"not null"`
	ApproverID    string     `json:"approver_id" gorm:"not null"`
	ApproverName  string     `json:"approver_name" gorm:"not null"`
	Status        string     `json:"status" gorm:"not null"` // pending, approved, rejected
	Comments      string     `json:"comments" gorm:"type:text"`
	ApprovalTime  *time.Time `json:"approval_time"`
	CreateTime    time.Time  `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime    time.Time  `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (CampaignApproval) TableName() string {
	return "campaign_approval"
}

// CampaignExecution 活动执行记录
type CampaignExecution struct {
	ExecutionID   int64     `json:"execution_id" gorm:"primaryKey;autoIncrement"`
	CampaignID    int64     `json:"campaign_id" gorm:"not null"`
	ExecutionTime time.Time `json:"execution_time" gorm:"autoCreateTime"`
	Status        string    `json:"status" gorm:"not null"` // success, failed, partial
	TotalUsers    int64     `json:"total_users" gorm:"default:0"`
	SuccessUsers  int64     `json:"success_users" gorm:"default:0"`
	FailedUsers   int64     `json:"failed_users" gorm:"default:0"`
	ErrorMsg      string    `json:"error_msg" gorm:"type:text"`
}

// TableName 指定表名
func (CampaignExecution) TableName() string {
	return "campaign_execution"
}
