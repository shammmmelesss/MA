package repository

import (
	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

type ImageGroupRepository interface {
	Create(g *model.ImageGroup) error
	Update(g *model.ImageGroup) error
	GetByID(id int64) (*model.ImageGroup, error)
	List(projectID int64, name, status string, page, pageSize int) ([]*model.ImageGroup, int64, error)
	Delete(id int64) error
	// Items
	SaveItems(groupID int64, items []model.ImageItem) error // 先删后插
	GetItems(groupID int64) ([]model.ImageItem, error)
}

type imageGroupRepository struct {
	db *gorm.DB
}

func NewImageGroupRepository(db *gorm.DB) ImageGroupRepository {
	return &imageGroupRepository{db: db}
}

func (r *imageGroupRepository) Create(g *model.ImageGroup) error {
	return r.db.Create(g).Error
}

func (r *imageGroupRepository) Update(g *model.ImageGroup) error {
	return r.db.Save(g).Error
}

func (r *imageGroupRepository) GetByID(id int64) (*model.ImageGroup, error) {
	var g model.ImageGroup
	if err := r.db.Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort ASC")
	}).First(&g, id).Error; err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *imageGroupRepository) List(projectID int64, name, status string, page, pageSize int) ([]*model.ImageGroup, int64, error) {
	query := r.db.Model(&model.ImageGroup{}).Where("project_id = ?", projectID)
	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var list []*model.ImageGroup
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&list).Error; err != nil {
		return nil, 0, err
	}

	// Fill ItemCount for each group
	for _, g := range list {
		var count int64
		r.db.Model(&model.ImageItem{}).Where("group_id = ?", g.ID).Count(&count)
		g.ItemCount = int(count)
	}

	return list, total, nil
}

func (r *imageGroupRepository) Delete(id int64) error {
	return r.db.Delete(&model.ImageGroup{}, id).Error
}

func (r *imageGroupRepository) SaveItems(groupID int64, items []model.ImageItem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("group_id = ?", groupID).Delete(&model.ImageItem{}).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return nil
		}
		for i := range items {
			items[i].GroupID = groupID
		}
		return tx.Create(&items).Error
	})
}

func (r *imageGroupRepository) GetItems(groupID int64) ([]model.ImageItem, error) {
	var items []model.ImageItem
	if err := r.db.Where("group_id = ?", groupID).Order("sort ASC").Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}
