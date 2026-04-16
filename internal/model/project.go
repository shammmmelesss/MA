package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// StringArray 自定义类型，用于在数据库中存储字符串数组（JSON格式）
type StringArray []string

// Scan 实现 sql.Scanner 接口
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = StringArray{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("StringArray.Scan: expected []byte or string, got %T", value)
	}
	return json.Unmarshal(bytes, s)
}

// Value 实现 driver.Valuer 接口
func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

// ProjectSpace 项目空间定义
type ProjectSpace struct {
	ProjectID         int64       `json:"project_id" gorm:"primaryKey;autoIncrement"`
	ProjectName       string      `json:"project_name" gorm:"not null"`
	LinkedProject     string      `json:"linked_project"`
	Description       string      `json:"description"`
	Status            int         `json:"status" gorm:"default:1"`          // 1:正常, 0:禁用
	ProjectManager    StringArray `json:"project_manager" gorm:"type:jsonb"`
	AppPackages       StringArray `json:"app_packages" gorm:"type:jsonb"`
	FirebaseProjectID string      `json:"firebase_project_id"`
	AccessKey         string      `json:"access_key"`
	Secret            string      `json:"secret"`
	Creator           string      `json:"creator"`
	Modifier          string      `json:"modifier"`
	CreateTime        time.Time   `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime        time.Time   `json:"update_time" gorm:"autoUpdateTime"`
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
