package repository

import (
	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

// TagRepository 标签仓库接口
type TagRepository interface {
	// 标签定义相关 - 与TagService保持一致的方法名
	GetTag(tagCode string) (*model.TagDefinition, error)
	CreateTag(tag *model.TagDefinition) error
	UpdateTag(tag *model.TagDefinition) error
	DeleteTag(tagCode string) error
	UpdateTagStatus(tagCode string, isActive int) error
	ListTags(filter map[string]interface{}, page, pageSize int) ([]*model.TagDefinition, int64, error)
	GetTagPlayerCount(tagCode string) (int64, error)

	// 原始方法名，保持兼容性
	GetTagDefinition(tagCode string) (*model.TagDefinition, error)
	CreateTagDefinition(tag *model.TagDefinition) error
	UpdateTagDefinition(tag *model.TagDefinition) error
	DeleteTagDefinition(tagCode string) error
	ListTagDefinitions(tagType, gameID string, isActive int, page, pageSize int) ([]*model.TagDefinition, int64, error)

	// 玩家标签关联相关
	GetPlayerTags(playerID int64) ([]*model.PlayerTag, error)
	AddPlayerTag(tag *model.PlayerTag) error
	BatchAddPlayerTags(tags []*model.PlayerTag) error
	RemovePlayerTag(playerID int64, tagCode string) error
	BatchRemovePlayerTags(playerID int64, tagCodes []string) error
	QueryPlayerIDsByTag(tagCode, tagValue, gameID string) ([]int64, error)
	QueryPlayerIDsByTags(tagConditions map[string]string, gameID string) ([]int64, error)
}

// tagRepository 标签仓库实现
type tagRepository struct {
	db *gorm.DB
}

// NewTagRepository 创建标签仓库实例
func NewTagRepository(db *gorm.DB) TagRepository {
	return &tagRepository{db: db}
}

// GetTagDefinition 根据标签编码获取标签定义
func (r *tagRepository) GetTagDefinition(tagCode string) (*model.TagDefinition, error) {
	var tag model.TagDefinition
	result := r.db.First(&tag, "tag_code = ?", tagCode)
	if result.Error != nil {
		return nil, result.Error
	}
	return &tag, nil
}

// CreateTagDefinition 创建标签定义
func (r *tagRepository) CreateTagDefinition(tag *model.TagDefinition) error {
	return r.db.Create(tag).Error
}

// UpdateTagDefinition 更新标签定义
func (r *tagRepository) UpdateTagDefinition(tag *model.TagDefinition) error {
	return r.db.Save(tag).Error
}

// DeleteTagDefinition 删除标签定义
func (r *tagRepository) DeleteTagDefinition(tagCode string) error {
	// 先删除玩家标签关联
	if err := r.db.Delete(&model.PlayerTag{}, "tag_code = ?", tagCode).Error; err != nil {
		return err
	}
	// 再删除标签定义
	return r.db.Delete(&model.TagDefinition{}, "tag_code = ?", tagCode).Error
}

// ListTagDefinitions 列出标签定义
func (r *tagRepository) ListTagDefinitions(tagType, gameID string, isActive int, page, pageSize int) ([]*model.TagDefinition, int64, error) {
	var tags []*model.TagDefinition
	var total int64

	query := r.db.Model(&model.TagDefinition{})

	// 添加查询条件
	if tagType != "" {
		query = query.Where("tag_type = ?", tagType)
	}
	if isActive != -1 {
		query = query.Where("is_active = ?", isActive)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&tags).Error; err != nil {
		return nil, 0, err
	}

	return tags, total, nil
}

// GetPlayerTags 获取玩家的标签列表
func (r *tagRepository) GetPlayerTags(playerID int64) ([]*model.PlayerTag, error) {
	var tags []*model.PlayerTag
	result := r.db.Where("player_id = ?", playerID).Find(&tags)
	if result.Error != nil {
		return nil, result.Error
	}
	return tags, nil
}

// AddPlayerTag 给玩家添加标签
func (r *tagRepository) AddPlayerTag(tag *model.PlayerTag) error {
	// 先检查是否已存在
	var existingTag model.PlayerTag
	result := r.db.Where("player_id = ? AND tag_code = ?", tag.PlayerID, tag.TagCode).First(&existingTag)

	if result.Error == nil {
		// 已存在，更新
		existingTag.TagValue = tag.TagValue
		existingTag.ExpireTime = tag.ExpireTime
		return r.db.Save(&existingTag).Error
	} else if result.Error == gorm.ErrRecordNotFound {
		// 不存在，创建
		return r.db.Create(tag).Error
	} else {
		// 其他错误
		return result.Error
	}
}

// BatchAddPlayerTags 批量给玩家添加标签
func (r *tagRepository) BatchAddPlayerTags(tags []*model.PlayerTag) error {
	// 使用事务批量处理
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, tag := range tags {
			// 先检查是否已存在
			var existingTag model.PlayerTag
			result := tx.Where("player_id = ? AND tag_code = ?", tag.PlayerID, tag.TagCode).First(&existingTag)

			if result.Error == nil {
				// 已存在，更新
				existingTag.TagValue = tag.TagValue
				existingTag.ExpireTime = tag.ExpireTime
				if err := tx.Save(&existingTag).Error; err != nil {
					return err
				}
			} else if result.Error == gorm.ErrRecordNotFound {
				// 不存在，创建
				if err := tx.Create(tag).Error; err != nil {
					return err
				}
			} else {
				// 其他错误
				return result.Error
			}
		}
		return nil
	})
}

// RemovePlayerTag 移除玩家的标签
func (r *tagRepository) RemovePlayerTag(playerID int64, tagCode string) error {
	return r.db.Delete(&model.PlayerTag{}, "player_id = ? AND tag_code = ?", playerID, tagCode).Error
}

// BatchRemovePlayerTags 批量移除玩家的标签
func (r *tagRepository) BatchRemovePlayerTags(playerID int64, tagCodes []string) error {
	return r.db.Delete(&model.PlayerTag{}, "player_id = ? AND tag_code IN ?", playerID, tagCodes).Error
}

// GetTag 根据标签编码获取标签定义 - 与TagService保持一致
func (r *tagRepository) GetTag(tagCode string) (*model.TagDefinition, error) {
	return r.GetTagDefinition(tagCode)
}

// CreateTag 创建标签定义 - 与TagService保持一致
func (r *tagRepository) CreateTag(tag *model.TagDefinition) error {
	return r.CreateTagDefinition(tag)
}

// UpdateTag 更新标签定义 - 与TagService保持一致
func (r *tagRepository) UpdateTag(tag *model.TagDefinition) error {
	return r.UpdateTagDefinition(tag)
}

// DeleteTag 删除标签定义 - 与TagService保持一致
func (r *tagRepository) DeleteTag(tagCode string) error {
	return r.DeleteTagDefinition(tagCode)
}

// UpdateTagStatus 更新标签状态
func (r *tagRepository) UpdateTagStatus(tagCode string, isActive int) error {
	return r.db.Model(&model.TagDefinition{}).Where("tag_code = ?", tagCode).Update("is_active", isActive).Error
}

// ListTags 列出标签定义 - 与TagService保持一致
func (r *tagRepository) ListTags(filter map[string]interface{}, page, pageSize int) ([]*model.TagDefinition, int64, error) {
	var tags []*model.TagDefinition
	var total int64

	query := r.db.Model(&model.TagDefinition{})

	// 应用筛选条件
	for key, value := range filter {
		query = query.Where(key, value)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&tags).Error; err != nil {
		return nil, 0, err
	}

	return tags, total, nil
}

// GetTagPlayerCount 获取标签关联的玩家数量
func (r *tagRepository) GetTagPlayerCount(tagCode string) (int64, error) {
	var count int64
	result := r.db.Model(&model.PlayerTag{}).Where("tag_code = ?", tagCode).Count(&count)
	if result.Error != nil {
		return 0, result.Error
	}
	return count, nil
}

// QueryPlayerIDsByTag 根据标签查询玩家ID列表
func (r *tagRepository) QueryPlayerIDsByTag(tagCode, tagValue, gameID string) ([]int64, error) {
	var playerIDs []int64
	query := r.db.Model(&model.PlayerTag{}).Select("player_id").Where("game_id = ? AND tag_code = ?", gameID, tagCode)

	if tagValue != "" {
		query = query.Where("tag_value = ?", tagValue)
	}

	result := query.Find(&playerIDs)
	if result.Error != nil {
		return nil, result.Error
	}

	return playerIDs, nil
}

// QueryPlayerIDsByTags 根据多个标签条件查询玩家ID列表
func (r *tagRepository) QueryPlayerIDsByTags(tagConditions map[string]string, gameID string) ([]int64, error) {
	var playerIDs []int64
	
	// 构建查询，使用子查询实现多标签交集
	query := r.db.Model(&model.PlayerTag{}).Select("player_id").Where("game_id = ?", gameID)
	
	// 构建标签条件
	for tagCode, tagValue := range tagConditions {
		// 为每个标签条件创建子查询
		subQuery := r.db.Model(&model.PlayerTag{}).Select("player_id").Where("game_id = ? AND tag_code = ? AND tag_value = ?", gameID, tagCode, tagValue)
		query = query.Where("player_id IN (?)", subQuery)
	}
	
	// 去重
	query = query.Group("player_id")
	
	result := query.Find(&playerIDs)
	if result.Error != nil {
		return nil, result.Error
	}
	
	return playerIDs, nil
}
