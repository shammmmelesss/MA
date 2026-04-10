package repository

import (
	"time"

	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

// SegmentRepository 分群仓库接口
type SegmentRepository interface {
	// 分群定义相关
	GetSegmentByID(segmentID int64) (*model.SegmentDefinition, error)
	CreateSegment(segment *model.SegmentDefinition) error
	UpdateSegment(segment *model.SegmentDefinition) error
	DeleteSegment(segmentID int64) error
	ListSegments(gameID, segmentType, status string, page, pageSize int) ([]*model.SegmentDefinition, int64, error)

	// 分群玩家关联相关
	GetSegmentPlayers(segmentID int64, page, pageSize int) ([]int64, int64, error)
	AddPlayerToSegment(segmentID, playerID int64, gameID string) error
	BatchAddPlayersToSegment(segmentID int64, playerIDs []int64, gameID string) error
	RemovePlayerFromSegment(segmentID, playerID int64) error
	BatchRemovePlayersFromSegment(segmentID int64, playerIDs []int64) error
	GetPlayerSegments(playerID int64) ([]int64, error)
	ClearSegmentPlayers(segmentID int64) error
}

// segmentRepository 分群仓库实现
type segmentRepository struct {
	db *gorm.DB
}

// NewSegmentRepository 创建分群仓库实例
func NewSegmentRepository(db *gorm.DB) SegmentRepository {
	return &segmentRepository{db: db}
}

// GetSegmentByID 根据分群ID获取分群定义
func (r *segmentRepository) GetSegmentByID(segmentID int64) (*model.SegmentDefinition, error) {
	var segment model.SegmentDefinition
	result := r.db.First(&segment, segmentID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &segment, nil
}

// CreateSegment 创建分群定义
func (r *segmentRepository) CreateSegment(segment *model.SegmentDefinition) error {
	return r.db.Create(segment).Error
}

// UpdateSegment 更新分群定义
func (r *segmentRepository) UpdateSegment(segment *model.SegmentDefinition) error {
	return r.db.Save(segment).Error
}

// DeleteSegment 删除分群定义
func (r *segmentRepository) DeleteSegment(segmentID int64) error {
	// 先清除分群玩家关联
	if err := r.ClearSegmentPlayers(segmentID); err != nil {
		return err
	}
	// 再删除分群定义
	return r.db.Delete(&model.SegmentDefinition{}, segmentID).Error
}

// ListSegments 列出分群定义
func (r *segmentRepository) ListSegments(gameID, segmentType, status string, page, pageSize int) ([]*model.SegmentDefinition, int64, error) {
	var segments []*model.SegmentDefinition
	var total int64

	query := r.db.Model(&model.SegmentDefinition{}).Where("game_id = ?", gameID)

	// 添加查询条件
	if segmentType != "" {
		query = query.Where("segment_type = ?", segmentType)
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
	if err := query.Offset(offset).Limit(pageSize).Order("create_time DESC").Find(&segments).Error; err != nil {
		return nil, 0, err
	}

	return segments, total, nil
}

// GetSegmentPlayers 获取分群玩家列表
func (r *segmentRepository) GetSegmentPlayers(segmentID int64, page, pageSize int) ([]int64, int64, error) {
	var playerIDs []int64
	var total int64

	// 获取总数
	if err := r.db.Model(&model.SegmentPlayerRelation{}).Where("segment_id = ? AND is_active = ?", segmentID, 1).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	result := r.db.Model(&model.SegmentPlayerRelation{}).
		Select("player_id").
		Where("segment_id = ? AND is_active = ?", segmentID, 1).
		Offset(offset).
		Limit(pageSize).
		Find(&playerIDs)

	if result.Error != nil {
		return nil, 0, result.Error
	}

	return playerIDs, total, nil
}

// AddPlayerToSegment 将玩家添加到分群
func (r *segmentRepository) AddPlayerToSegment(segmentID, playerID int64, gameID string) error {
	// 检查是否已存在
	var existingRelation model.SegmentPlayerRelation
	result := r.db.Where("segment_id = ? AND player_id = ?", segmentID, playerID).First(&existingRelation)

	if result.Error == nil {
		// 已存在，更新为活跃状态
		existingRelation.IsActive = 1
		existingRelation.LeaveTime = time.Time{}
		return r.db.Save(&existingRelation).Error
	} else if result.Error == gorm.ErrRecordNotFound {
		// 不存在，创建
		relation := model.SegmentPlayerRelation{
			SegmentID: segmentID,
			PlayerID:  playerID,
			GameID:    gameID,
			IsActive:  1,
		}
		return r.db.Create(&relation).Error
	} else {
		// 其他错误
		return result.Error
	}
}

// BatchAddPlayersToSegment 批量将玩家添加到分群
func (r *segmentRepository) BatchAddPlayersToSegment(segmentID int64, playerIDs []int64, gameID string) error {
	// 使用事务批量处理
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, playerID := range playerIDs {
			// 检查是否已存在
			var existingRelation model.SegmentPlayerRelation
			result := tx.Where("segment_id = ? AND player_id = ?", segmentID, playerID).First(&existingRelation)

			if result.Error == nil {
				// 已存在，更新为活跃状态
				existingRelation.IsActive = 1
				existingRelation.LeaveTime = time.Time{}
				if err := tx.Save(&existingRelation).Error; err != nil {
					return err
				}
			} else if result.Error == gorm.ErrRecordNotFound {
				// 不存在，创建
				relation := model.SegmentPlayerRelation{
					SegmentID: segmentID,
					PlayerID:  playerID,
					GameID:    gameID,
					IsActive:  1,
				}
				if err := tx.Create(&relation).Error; err != nil {
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

// RemovePlayerFromSegment 将玩家从分群中移除
func (r *segmentRepository) RemovePlayerFromSegment(segmentID, playerID int64) error {
	return r.db.Delete(&model.SegmentPlayerRelation{}, "segment_id = ? AND player_id = ?", segmentID, playerID).Error
}

// BatchRemovePlayersFromSegment 批量将玩家从分群中移除
func (r *segmentRepository) BatchRemovePlayersFromSegment(segmentID int64, playerIDs []int64) error {
	return r.db.Delete(&model.SegmentPlayerRelation{}, "segment_id = ? AND player_id IN ?", segmentID, playerIDs).Error
}

// GetPlayerSegments 获取玩家所属的分群列表
func (r *segmentRepository) GetPlayerSegments(playerID int64) ([]int64, error) {
	var segmentIDs []int64
	result := r.db.Model(&model.SegmentPlayerRelation{}).
		Select("segment_id").
		Where("player_id = ? AND is_active = ?", playerID, 1).
		Find(&segmentIDs)

	if result.Error != nil {
		return nil, result.Error
	}

	return segmentIDs, nil
}

// ClearSegmentPlayers 清空分群中的所有玩家
func (r *segmentRepository) ClearSegmentPlayers(segmentID int64) error {
	return r.db.Delete(&model.SegmentPlayerRelation{}, "segment_id = ?", segmentID).Error
}
