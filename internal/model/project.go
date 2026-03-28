package model

import (
	"time"
)

// ProjectSpace 项目空间定义
type ProjectSpace struct {
	ProjectID     int64     `json:"project_id" gorm:"primaryKey;autoIncrement"`
	ProjectName   string     `json:"project_name" gorm:"not null;unique"`
	Description   string     `json:"description"`
	Status        int        `json:"status" gorm:"default:1"` // 1:正常, 0:禁用
	Creator       string     `json:"creator" gorm:"not null"`
	CreateTime    time.Time  `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime    time.Time  `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ProjectSpace) TableName() string {
	return "project_space"
}

// ProjectMember 项目空间成员
type ProjectMember struct {
	ID          int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID   int64     `json:"project_id" gorm:"not null"`
	UserID      string     `json:"user_id" gorm:"not null"`
	UserName    string     `json:"user_name" gorm:"not null"`
	Role        string     `json:"role" gorm:"not null"` // admin:管理员, member:成员
	CreateTime  time.Time  `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime  time.Time  `json:"update_time" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ProjectMember) TableName() string {
	return "project_member"
}
