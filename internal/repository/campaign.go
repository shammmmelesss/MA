package repository

import (
	"time"

	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

// CampaignRepository 营销活动仓库接口
type CampaignRepository interface {
	// 活动基础信息管理
	GetCampaignByID(campaignID int64) (*model.Campaign, error)
	CreateCampaign(campaign *model.Campaign) error
	UpdateCampaign(campaign *model.Campaign) error
	DeleteCampaign(campaignID int64) error
	ListCampaigns(gameID string, campaignType model.CampaignType, status model.CampaignStatus, page, pageSize int) ([]*model.Campaign, int64, error)

	// 活动配置管理
	GetCampaignConfig(campaignID int64, configType string) (*model.CampaignConfig, error)
	CreateCampaignConfig(config *model.CampaignConfig) error
	UpdateCampaignConfig(config *model.CampaignConfig) error
	DeleteCampaignConfig(configID int64) error

	// 活动渠道管理
	GetCampaignChannels(campaignID int64) ([]*model.CampaignChannel, error)
	CreateCampaignChannel(channel *model.CampaignChannel) error
	UpdateCampaignChannel(channel *model.CampaignChannel) error
	DeleteCampaignChannel(channelID int64) error

	// 活动内容管理
	GetCampaignContent(contentID int64) (*model.CampaignContent, error)
	GetCampaignContents(campaignID int64) ([]*model.CampaignContent, error)
	CreateCampaignContent(content *model.CampaignContent) error
	UpdateCampaignContent(content *model.CampaignContent) error
	DeleteCampaignContent(contentID int64) error

	// 活动审批管理
	GetCampaignApproval(campaignID int64) (*model.CampaignApproval, error)
	CreateCampaignApproval(approval *model.CampaignApproval) error
	UpdateCampaignApproval(approval *model.CampaignApproval) error

	// 活动执行记录
	CreateCampaignExecution(execution *model.CampaignExecution) error
	GetCampaignExecutions(campaignID int64, start, end time.Time) ([]*model.CampaignExecution, error)
}

// campaignRepository 营销活动仓库实现
type campaignRepository struct {
	db *gorm.DB
}

// NewCampaignRepository 创建营销活动仓库实例
func NewCampaignRepository(db *gorm.DB) CampaignRepository {
	return &campaignRepository{db: db}
}

// GetCampaignByID 根据活动ID获取活动信息
func (r *campaignRepository) GetCampaignByID(campaignID int64) (*model.Campaign, error) {
	var campaign model.Campaign
	result := r.db.First(&campaign, campaignID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &campaign, nil
}

// CreateCampaign 创建活动
func (r *campaignRepository) CreateCampaign(campaign *model.Campaign) error {
	return r.db.Create(campaign).Error
}

// UpdateCampaign 更新活动
func (r *campaignRepository) UpdateCampaign(campaign *model.Campaign) error {
	return r.db.Save(campaign).Error
}

// DeleteCampaign 删除活动
func (r *campaignRepository) DeleteCampaign(campaignID int64) error {
	// 使用事务删除相关联的所有数据
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 删除活动执行记录
		if err := tx.Delete(&model.CampaignExecution{}, "campaign_id = ?", campaignID).Error; err != nil {
			return err
		}

		// 删除活动审批记录
		if err := tx.Delete(&model.CampaignApproval{}, "campaign_id = ?", campaignID).Error; err != nil {
			return err
		}

		// 获取活动内容
		var contents []*model.CampaignContent
		if err := tx.Where("campaign_id = ?", campaignID).Find(&contents).Error; err != nil {
			return err
		}

		// 删除活动渠道
		if err := tx.Delete(&model.CampaignChannel{}, "campaign_id = ?", campaignID).Error; err != nil {
			return err
		}

		// 删除活动内容
		for _, content := range contents {
			if err := tx.Delete(&model.CampaignContent{}, content.ContentID).Error; err != nil {
				return err
			}
		}

		// 删除活动配置
		if err := tx.Delete(&model.CampaignConfig{}, "campaign_id = ?", campaignID).Error; err != nil {
			return err
		}

		// 删除活动本身
		if err := tx.Delete(&model.Campaign{}, campaignID).Error; err != nil {
			return err
		}

		return nil
	})
}

// ListCampaigns 列出活动
func (r *campaignRepository) ListCampaigns(gameID string, campaignType model.CampaignType, status model.CampaignStatus, page, pageSize int) ([]*model.Campaign, int64, error) {
	var campaigns []*model.Campaign
	var total int64

	query := r.db.Model(&model.Campaign{}).Where("game_id = ?", gameID)

	// 添加查询条件
	if campaignType != "" {
		query = query.Where("campaign_type = ?", campaignType)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("priority DESC, create_time DESC").Find(&campaigns).Error; err != nil {
		return nil, 0, err
	}

	return campaigns, total, nil
}

// GetCampaignConfig 获取活动配置
func (r *campaignRepository) GetCampaignConfig(campaignID int64, configType string) (*model.CampaignConfig, error) {
	var config model.CampaignConfig
	result := r.db.Where("campaign_id = ? AND config_type = ?", campaignID, configType).First(&config)
	if result.Error != nil {
		return nil, result.Error
	}
	return &config, nil
}

// CreateCampaignConfig 创建活动配置
func (r *campaignRepository) CreateCampaignConfig(config *model.CampaignConfig) error {
	return r.db.Create(config).Error
}

// UpdateCampaignConfig 更新活动配置
func (r *campaignRepository) UpdateCampaignConfig(config *model.CampaignConfig) error {
	return r.db.Save(config).Error
}

// DeleteCampaignConfig 删除活动配置
func (r *campaignRepository) DeleteCampaignConfig(configID int64) error {
	return r.db.Delete(&model.CampaignConfig{}, configID).Error
}

// GetCampaignChannels 获取活动渠道配置
func (r *campaignRepository) GetCampaignChannels(campaignID int64) ([]*model.CampaignChannel, error) {
	var channels []*model.CampaignChannel
	result := r.db.Where("campaign_id = ?", campaignID).Find(&channels)
	if result.Error != nil {
		return nil, result.Error
	}
	return channels, nil
}

// CreateCampaignChannel 创建活动渠道配置
func (r *campaignRepository) CreateCampaignChannel(channel *model.CampaignChannel) error {
	return r.db.Create(channel).Error
}

// UpdateCampaignChannel 更新活动渠道配置
func (r *campaignRepository) UpdateCampaignChannel(channel *model.CampaignChannel) error {
	return r.db.Save(channel).Error
}

// DeleteCampaignChannel 删除活动渠道配置
func (r *campaignRepository) DeleteCampaignChannel(channelID int64) error {
	return r.db.Delete(&model.CampaignChannel{}, channelID).Error
}

// GetCampaignContent 获取活动内容
func (r *campaignRepository) GetCampaignContent(contentID int64) (*model.CampaignContent, error) {
	var content model.CampaignContent
	result := r.db.First(&content, contentID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &content, nil
}

// GetCampaignContents 获取活动所有内容
func (r *campaignRepository) GetCampaignContents(campaignID int64) ([]*model.CampaignContent, error) {
	var contents []*model.CampaignContent
	result := r.db.Where("campaign_id = ?", campaignID).Find(&contents)
	if result.Error != nil {
		return nil, result.Error
	}
	return contents, nil
}

// CreateCampaignContent 创建活动内容
func (r *campaignRepository) CreateCampaignContent(content *model.CampaignContent) error {
	return r.db.Create(content).Error
}

// UpdateCampaignContent 更新活动内容
func (r *campaignRepository) UpdateCampaignContent(content *model.CampaignContent) error {
	return r.db.Save(content).Error
}

// DeleteCampaignContent 删除活动内容
func (r *campaignRepository) DeleteCampaignContent(contentID int64) error {
	return r.db.Delete(&model.CampaignContent{}, contentID).Error
}

// GetCampaignApproval 获取活动审批记录
func (r *campaignRepository) GetCampaignApproval(campaignID int64) (*model.CampaignApproval, error) {
	var approval model.CampaignApproval
	result := r.db.Where("campaign_id = ?", campaignID).First(&approval)
	if result.Error != nil {
		return nil, result.Error
	}
	return &approval, nil
}

// CreateCampaignApproval 创建活动审批记录
func (r *campaignRepository) CreateCampaignApproval(approval *model.CampaignApproval) error {
	return r.db.Create(approval).Error
}

// UpdateCampaignApproval 更新活动审批记录
func (r *campaignRepository) UpdateCampaignApproval(approval *model.CampaignApproval) error {
	return r.db.Save(approval).Error
}

// CreateCampaignExecution 创建活动执行记录
func (r *campaignRepository) CreateCampaignExecution(execution *model.CampaignExecution) error {
	return r.db.Create(execution).Error
}

// GetCampaignExecutions 获取活动执行记录
func (r *campaignRepository) GetCampaignExecutions(campaignID int64, start, end time.Time) ([]*model.CampaignExecution, error) {
	var executions []*model.CampaignExecution
	result := r.db.Where("campaign_id = ? AND execution_time BETWEEN ? AND ?", campaignID, start, end).Order("execution_time DESC").Find(&executions)
	if result.Error != nil {
		return nil, result.Error
	}
	return executions, nil
}
