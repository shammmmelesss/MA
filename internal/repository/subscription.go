package repository

import (
	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

type SubscriptionRepository interface {
	Create(s *model.UserSubscription) error
	Update(s *model.UserSubscription) error
	GetByID(id int64) (*model.UserSubscription, error)
	List(projectID int64, name, status, subType string, page, pageSize int) ([]*model.UserSubscription, int64, error)
	Delete(id int64) error
}

type subscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) Create(s *model.UserSubscription) error {
	return r.db.Create(s).Error
}

func (r *subscriptionRepository) Update(s *model.UserSubscription) error {
	return r.db.Save(s).Error
}

func (r *subscriptionRepository) GetByID(id int64) (*model.UserSubscription, error) {
	var s model.UserSubscription
	if err := r.db.First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *subscriptionRepository) List(projectID int64, name, status, subType string, page, pageSize int) ([]*model.UserSubscription, int64, error) {
	query := r.db.Model(&model.UserSubscription{}).Where("project_id = ?", projectID)
	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if subType != "" {
		query = query.Where("type = ?", subType)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var list []*model.UserSubscription
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *subscriptionRepository) Delete(id int64) error {
	return r.db.Delete(&model.UserSubscription{}, id).Error
}
