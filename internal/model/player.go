package model

import "time"

// PlayerBase 玩家基础信息
type PlayerBase struct {
	PlayerID      int64     `json:"player_id" gorm:"primaryKey"`
	ProjectID     int64     `json:"project_id" gorm:"not null"`
	GameID        string    `json:"game_id" gorm:"not null"`
	AccountID     string    `json:"account_id" gorm:"not null"`
	RoleID        string    `json:"role_id"`
	RoleName      string    `json:"role_name"`
	ServerID      string    `json:"server_id"`
	Gender        int       `json:"gender"` // 1:男, 2:女, 0:未知
	Age           int       `json:"age"`
	RegisterTime  time.Time `json:"register_time" gorm:"not null"`
	LastLoginTime time.Time `json:"last_login_time"`
	Level         int       `json:"level" gorm:"default:1"`
	VipLevel      int       `json:"vip_level" gorm:"default:0"`
	Status        int       `json:"status" gorm:"default:1"` // 1:正常, 0:冻结
	CreateTime    time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime    time.Time `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (PlayerBase) TableName() string {
	return "player_base"
}
