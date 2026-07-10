package model

import "time"

// ImageGroup 图片组
type ImageGroup struct {
	ID        int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID int64     `json:"project_id" gorm:"not null;index"`
	Name      string    `json:"name" gorm:"not null"`
	ImageType string    `json:"image_type" gorm:"not null"` // notification/large/background/right_large
	Status    string    `json:"status" gorm:"default:'enabled'"`  // enabled/disabled
	CreatedBy string    `json:"created_by"`
	UpdatedBy string    `json:"updated_by"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	Items     []ImageItem `json:"items,omitempty" gorm:"foreignKey:GroupID;references:ID"`
	ItemCount int         `json:"item_count" gorm:"-"` // 查询时填入
}

func (ImageGroup) TableName() string { return "image_group" }

// ImageItem 图片组内的单条图片记录
type ImageItem struct {
	ID        int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	GroupID   int64     `json:"group_id" gorm:"not null;index"`
	Sort      int       `json:"sort" gorm:"default:0"`
	ItemType  string    `json:"item_type" gorm:"default:'image'"` // image/url
	ImageURL  string    `json:"image_url"`  // 上传图片的访问地址
	LinkURL   string    `json:"link_url"`   // URL类型的地址
	Tags      string    `json:"tags"`       // 逗号分隔标签
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (ImageItem) TableName() string { return "image_item" }
