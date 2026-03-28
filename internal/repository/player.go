package repository

import (
	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

// PlayerRepository 玩家仓库接口
type PlayerRepository interface {
	GetPlayerByID(playerID int64) (*model.PlayerBase, error)
	CreatePlayer(player *model.PlayerBase) error
	UpdatePlayer(player *model.PlayerBase) error
	GetPlayersByIDs(playerIDs []int64) ([]*model.PlayerBase, error)
	QueryPlayersByCondition(conditions map[string]interface{}, gameID string, page, pageSize int) ([]*model.PlayerBase, int64, error)
}

// playerRepository 玩家仓库实现
type playerRepository struct {
	db *gorm.DB
}

// NewPlayerRepository 创建玩家仓库实例
func NewPlayerRepository(db *gorm.DB) PlayerRepository {
	return &playerRepository{db: db}
}

// GetPlayerByID 根据玩家ID获取玩家信息
func (r *playerRepository) GetPlayerByID(playerID int64) (*model.PlayerBase, error) {
	var player model.PlayerBase
	result := r.db.First(&player, playerID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &player, nil
}

// CreatePlayer 创建玩家信息
func (r *playerRepository) CreatePlayer(player *model.PlayerBase) error {
	return r.db.Create(player).Error
}

// UpdatePlayer 更新玩家信息
func (r *playerRepository) UpdatePlayer(player *model.PlayerBase) error {
	return r.db.Save(player).Error
}

// GetPlayersByIDs 根据玩家ID列表获取玩家信息
func (r *playerRepository) GetPlayersByIDs(playerIDs []int64) ([]*model.PlayerBase, error) {
	var players []*model.PlayerBase
	result := r.db.Where("player_id IN ?", playerIDs).Find(&players)
	if result.Error != nil {
		return nil, result.Error
	}
	return players, nil
}

// QueryPlayersByCondition 根据条件查询玩家
func (r *playerRepository) QueryPlayersByCondition(conditions map[string]interface{}, gameID string, page, pageSize int) ([]*model.PlayerBase, int64, error) {
	var players []*model.PlayerBase
	var total int64

	query := r.db.Model(&model.PlayerBase{}).Where("game_id = ?", gameID)

	// 添加查询条件
	for key, value := range conditions {
		query = query.Where(key, value)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&players).Error; err != nil {
		return nil, 0, err
	}

	return players, total, nil
}
