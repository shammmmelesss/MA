package model

import (
	"time"
)

// AppInfo App基础信息
// App基础信息管理（核心功能）
type AppInfo struct {
	AppID             string    `json:"app_id" gorm:"primaryKey;type:varchar(32);unique"` // App唯一标识，系统自动生成
	GameName          string    `json:"game_name" gorm:"not null;type:varchar(50)"`      // 游戏名称
	PackageName       string    `json:"package_name" gorm:"not null;type:varchar(100);unique"` // 包名/Bundle ID
	PlatformType      string    `json:"platform_type" gorm:"not null;type:varchar(20)"` // Android、iOS、双平台
	Status            string    `json:"status" gorm:"not null;type:varchar(20);default:'draft'"` // 草稿、审核中、已上线、已禁用
	Owner             string    `json:"owner" gorm:"not null;type:varchar(50)"`         // 负责人
	OwnerContact      string    `json:"owner_contact" gorm:"type:varchar(100)"`        // 负责人联系方式
	Remark            string    `json:"remark" gorm:"type:text"`                      // 备注
	IsDeleted         bool      `json:"is_deleted" gorm:"default:false"`              // 逻辑删除标识
	CreateTime        time.Time `json:"create_time" gorm:"autoCreateTime"`            // 创建时间
	UpdateTime        time.Time `json:"update_time" gorm:"autoUpdateTime"`            // 更新时间
}

// TableName 指定表名
func (AppInfo) TableName() string {
	return "app_info"
}

// AppAuth App接入鉴权信息
// 接入鉴权与安全（核心功能）
type AppAuth struct {
	ID              int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	AppID           string    `json:"app_id" gorm:"not null;type:varchar(32);unique"` // 关联AppID
	AccessKey       string    `json:"access_key" gorm:"not null;type:varchar(32);unique"` // AccessKey
	SecretKey       string    `json:"secret_key" gorm:"not null;type:varchar(64)"` // SecretKey
	AuthStatus      string    `json:"auth_status" gorm:"not null;type:varchar(20);default:'enabled'"` // 启用、禁用
	IPWhitelist     string    `json:"ip_whitelist" gorm:"type:text"` // IP白名单，多行文本，每行一个IP/网段
	GenerateTime    time.Time `json:"generate_time" gorm:"autoCreateTime"` // 生成时间
	ResetTime       time.Time `json:"reset_time"` // 重置时间
	ResetBy         string    `json:"reset_by" gorm:"type:varchar(50)"` // 重置人
}

// TableName 指定表名
func (AppAuth) TableName() string {
	return "app_auth"
}

// AppChannelConfig 推送渠道配置
// 推送渠道配置（核心功能）
type AppChannelConfig struct {
	ID                  int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	AppID               string    `json:"app_id" gorm:"not null;type:varchar(32);unique"` // 关联AppID
	FCMConfig           string    `json:"fcm_config" gorm:"type:jsonb"` // FCM配置，存储为JSON格式
	APNsConfig          string    `json:"apns_config" gorm:"type:jsonb"` // APNs配置，存储为JSON格式
	PushEnvironment     string    `json:"push_environment" gorm:"not null;type:varchar(20);default:'test'"` // 测试、生产
	ChannelPriority     string    `json:"channel_priority" gorm:"type:text"` // 渠道优先级，JSON数组格式
	RetryStrategy       string    `json:"retry_strategy" gorm:"type:jsonb"` // 失败补发策略
	DailyPushLimit      int       `json:"daily_push_limit" gorm:"default:10"` // 单机日推送上限
	UserFrequencyLimit  int       `json:"user_frequency_limit" gorm:"default:3"` // 单用户频控上限（条/小时）
	ConfigStatus        string    `json:"config_status" gorm:"not null;type:varchar(20);default:'enabled'"` // 启用、禁用
	ConfigUpdateTime    time.Time `json:"config_update_time" gorm:"autoUpdateTime"` // 配置更新时间
	UpdatedBy           string    `json:"updated_by" gorm:"not null;type:varchar(50)"` // 更新人
}

// TableName 指定表名
func (AppChannelConfig) TableName() string {
	return "app_channel_config"
}

// DeviceInfo 设备信息
// 设备信息管理（核心功能）
type DeviceInfo struct {
	ID              int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	DeviceID        string    `json:"device_id" gorm:"not null;type:varchar(100)"` // 设备唯一标识
	AppID           string    `json:"app_id" gorm:"not null;type:varchar(32)"` // 关联AppID
	SubscriberID    string    `json:"subscriber_id" gorm:"not null;type:varchar(50)"` // 玩家ID
	TokenType       string    `json:"token_type" gorm:"not null;type:varchar(20);default:'FCM'"` // FCM、APNs
	DeviceToken     string    `json:"device_token" gorm:"not null;type:varchar(255)"` // 设备Token
	DevicePlatform  string    `json:"device_platform" gorm:"not null;type:varchar(20)"` // Android、iOS
	OSVersion       string    `json:"os_version" gorm:"type:varchar(50)"` // 系统版本
	DeviceModel     string    `json:"device_model" gorm:"type:varchar(100)"` // 设备型号
	TokenStatus     string    `json:"token_status" gorm:"not null;type:varchar(20);default:'active'"` // active、inactive、invalid
	LastActiveTime  time.Time `json:"last_active_time" gorm:"autoUpdateTime"` // 最后活跃时间
	CreateTime      time.Time `json:"create_time" gorm:"autoCreateTime"` // 创建时间
}

// TableName 指定表名
func (DeviceInfo) TableName() string {
	return "device_info"
}

// AuthLog 鉴权日志
// 记录接口调用的鉴权情况
type AuthLog struct {
	ID              int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	CallIP          string    `json:"call_ip" gorm:"not null;type:varchar(50)"` // 调用IP
	AccessKey       string    `json:"access_key" gorm:"not null;type:varchar(32)"` // AccessKey
	RequestAPI      string    `json:"request_api" gorm:"not null;type:varchar(100)"` // 请求接口
	RequestTime     time.Time `json:"request_time" gorm:"autoCreateTime"` // 请求时间
	AuthResult      string    `json:"auth_result" gorm:"not null;type:varchar(20)"` // 成功、失败
	FailReason      string    `json:"fail_reason" gorm:"type:text"` // 失败原因
}

// TableName 指定表名
func (AuthLog) TableName() string {
	return "auth_log"
}
