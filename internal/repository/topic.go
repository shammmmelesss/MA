package repository

import (
	"time"

	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// TopicRepository topic 仓库接口
type TopicRepository interface {
	Create(topic *model.TopicDefinition) error
	Update(topic *model.TopicDefinition) error
	GetByID(id int64) (*model.TopicDefinition, error)
	GetByKey(projectID int64, topicKey string) (*model.TopicDefinition, error)
	List(projectID int64, page, pageSize int) ([]*model.TopicDefinition, int64, error)
	SoftDelete(id int64) error

	Subscribe(projectID, topicID int64, accountID string) error
	Unsubscribe(projectID, topicID int64, accountID string) error
	GetSubscribers(projectID, topicID int64) ([]string, error)
	CountSubscribers(topicID int64) (int64, error)
	GetUserSubscriptions(projectID int64, accountID string) ([]*model.TopicDefinition, error)
}

type topicRepository struct {
	db *gorm.DB
}

func NewTopicRepository(db *gorm.DB) TopicRepository {
	return &topicRepository{db: db}
}

func (r *topicRepository) Create(topic *model.TopicDefinition) error {
	return r.db.Create(topic).Error
}

func (r *topicRepository) Update(topic *model.TopicDefinition) error {
	return r.db.Save(topic).Error
}

func (r *topicRepository) GetByID(id int64) (*model.TopicDefinition, error) {
	var t model.TopicDefinition
	if err := r.db.First(&t, id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *topicRepository) GetByKey(projectID int64, topicKey string) (*model.TopicDefinition, error) {
	var t model.TopicDefinition
	if err := r.db.Where("project_id = ? AND topic_key = ? AND is_active = true", projectID, topicKey).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *topicRepository) List(projectID int64, page, pageSize int) ([]*model.TopicDefinition, int64, error) {
	var topics []*model.TopicDefinition
	var total int64

	query := r.db.Model(&model.TopicDefinition{}).Where("project_id = ? AND is_active = true", projectID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&topics).Error; err != nil {
		return nil, 0, err
	}

	// 填充每个 topic 的订阅人数
	for _, t := range topics {
		count, _ := r.CountSubscribers(t.ID)
		t.SubCount = count
	}

	return topics, total, nil
}

func (r *topicRepository) SoftDelete(id int64) error {
	return r.db.Model(&model.TopicDefinition{}).Where("id = ?", id).Update("is_active", false).Error
}

func (r *topicRepository) Subscribe(projectID, topicID int64, accountID string) error {
	sub := model.TopicSubscription{
		ProjectID: projectID,
		TopicID:   topicID,
		AccountID: accountID,
		IsActive:  true,
	}
	// upsert：已存在则重新激活
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "project_id"}, {Name: "topic_id"}, {Name: "account_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{"is_active": true, "unsubscribed_at": nil}),
	}).Create(&sub).Error
}

func (r *topicRepository) Unsubscribe(projectID, topicID int64, accountID string) error {
	now := time.Now()
	return r.db.Model(&model.TopicSubscription{}).
		Where("project_id = ? AND topic_id = ? AND account_id = ? AND is_active = true", projectID, topicID, accountID).
		Updates(map[string]interface{}{"is_active": false, "unsubscribed_at": now}).Error
}

func (r *topicRepository) GetSubscribers(projectID, topicID int64) ([]string, error) {
	var accountIDs []string
	err := r.db.Model(&model.TopicSubscription{}).
		Where("project_id = ? AND topic_id = ? AND is_active = true", projectID, topicID).
		Pluck("account_id", &accountIDs).Error
	return accountIDs, err
}

func (r *topicRepository) CountSubscribers(topicID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.TopicSubscription{}).
		Where("topic_id = ? AND is_active = true", topicID).
		Count(&count).Error
	return count, err
}

func (r *topicRepository) GetUserSubscriptions(projectID int64, accountID string) ([]*model.TopicDefinition, error) {
	var topics []*model.TopicDefinition
	err := r.db.
		Joins("JOIN topic_subscription ts ON ts.topic_id = topic_definition.id").
		Where("topic_definition.project_id = ? AND ts.account_id = ? AND ts.is_active = true AND topic_definition.is_active = true", projectID, accountID).
		Find(&topics).Error
	return topics, err
}
