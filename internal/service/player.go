package service

import (
	"errors"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// 定义通用错误
var (
	ErrInvalidParameter = errors.New("invalid parameter")
	ErrInvalidOperation = errors.New("invalid operation")
)

// PlayerService 玩家服务接口
type PlayerService interface {
	// 获取玩家信息
	GetPlayerBaseInfo(playerID int64) (*model.PlayerBase, error)
	
	// 玩家标签管理
	GetPlayerTags(playerID int64) ([]*model.PlayerTag, error)
	AddPlayerTag(playerID int64, tagCode, tagValue, gameID string) error
	BatchAddPlayerTag(playerIDs []int64, tagCode, tagValue, gameID string) error
	RemovePlayerTag(playerID int64, tagCode string) error
	
	// 玩家查询
	QueryPlayersByTags(tagConditions map[string]string, gameID string) ([]int64, error)
}

// playerService 玩家服务实现
type playerService struct {
	playerRepo repository.PlayerRepository
	tagRepo    repository.TagRepository
}

// NewPlayerService 创建玩家服务实例
func NewPlayerService(playerRepo repository.PlayerRepository, tagRepo repository.TagRepository) PlayerService {
	return &playerService{
		playerRepo: playerRepo,
		tagRepo:    tagRepo,
	}
}

// GetPlayerBaseInfo 获取玩家基础信息
func (s *playerService) GetPlayerBaseInfo(playerID int64) (*model.PlayerBase, error) {
	return s.playerRepo.GetPlayerByID(playerID)
}

// GetPlayerTags 获取玩家标签列表
func (s *playerService) GetPlayerTags(playerID int64) ([]*model.PlayerTag, error) {
	return s.tagRepo.GetPlayerTags(playerID)
}

// AddPlayerTag 给玩家添加标签
func (s *playerService) AddPlayerTag(playerID int64, tagCode, tagValue, gameID string) error {
	// 先获取标签定义，确认标签存在
	tagDef, err := s.tagRepo.GetTagDefinition(tagCode)
	if err != nil {
		return err
	}

	// 创建玩家标签关联
	tag := &model.PlayerTag{
		PlayerID:   playerID,
		TagCode:    tagCode,
		TagValue:   tagValue,
		GameID:     gameID,
		TagType:    tagDef.TagType, // 从标签定义获取实际标签类型
	}

	return s.tagRepo.AddPlayerTag(tag)
}

// BatchAddPlayerTag 批量给玩家添加标签
func (s *playerService) BatchAddPlayerTag(playerIDs []int64, tagCode, tagValue, gameID string) error {
	// 先获取标签定义，确认标签存在
	tagDef, err := s.tagRepo.GetTagDefinition(tagCode)
	if err != nil {
		return err
	}

	// 创建玩家标签关联列表
	tags := make([]*model.PlayerTag, 0, len(playerIDs))
	for _, playerID := range playerIDs {
		tags = append(tags, &model.PlayerTag{
			PlayerID:   playerID,
			TagCode:    tagCode,
			TagValue:   tagValue,
			GameID:     gameID,
			TagType:    tagDef.TagType, // 从标签定义获取实际标签类型
		})
	}

	return s.tagRepo.BatchAddPlayerTags(tags)
}

// RemovePlayerTag 移除玩家标签
func (s *playerService) RemovePlayerTag(playerID int64, tagCode string) error {
	return s.tagRepo.RemovePlayerTag(playerID, tagCode)
}

// QueryPlayersByTags 根据标签条件查询玩家
func (s *playerService) QueryPlayersByTags(tagConditions map[string]string, gameID string) ([]int64, error) {
	return s.tagRepo.QueryPlayerIDsByTags(tagConditions, gameID)
}
