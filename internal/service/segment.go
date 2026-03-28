package service

import (
	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// SegmentService 分群服务接口
type SegmentService interface {
	// 分群定义管理
	GetSegmentByID(segmentID int64) (*model.SegmentDefinition, error)
	CreateSegment(segment *model.SegmentDefinition) (int64, error)
	UpdateSegment(segment *model.SegmentDefinition) error
	DeleteSegment(segmentID int64) error
	ListSegments(gameID, segmentType, status string, page, pageSize int) ([]*model.SegmentDefinition, int64, error)

	// 分群计算与管理
	ExecuteSegmentCalculation(segmentID int64) (int64, error)
	GetSegmentPlayers(segmentID int64, page, pageSize int) ([]int64, int64, error)
}

// segmentService 分群服务实现
type segmentService struct {
	segmentRepo repository.SegmentRepository
	tagRepo     repository.TagRepository
}

// NewSegmentService 创建分群服务实例
func NewSegmentService(segmentRepo repository.SegmentRepository, tagRepo repository.TagRepository) SegmentService {
	return &segmentService{
		segmentRepo: segmentRepo,
		tagRepo:     tagRepo,
	}
}

// GetSegmentByID 根据分群ID获取分群定义
func (s *segmentService) GetSegmentByID(segmentID int64) (*model.SegmentDefinition, error) {
	return s.segmentRepo.GetSegmentByID(segmentID)
}

// CreateSegment 创建分群
func (s *segmentService) CreateSegment(segment *model.SegmentDefinition) (int64, error) {
	err := s.segmentRepo.CreateSegment(segment)
	if err != nil {
		return 0, err
	}
	return segment.SegmentID, nil
}

// UpdateSegment 更新分群
func (s *segmentService) UpdateSegment(segment *model.SegmentDefinition) error {
	return s.segmentRepo.UpdateSegment(segment)
}

// DeleteSegment 删除分群
func (s *segmentService) DeleteSegment(segmentID int64) error {
	return s.segmentRepo.DeleteSegment(segmentID)
}

// ListSegments 列出分群
func (s *segmentService) ListSegments(gameID, segmentType, status string, page, pageSize int) ([]*model.SegmentDefinition, int64, error) {
	return s.segmentRepo.ListSegments(gameID, segmentType, status, page, pageSize)
}

// ExecuteSegmentCalculation 执行分群计算
func (s *segmentService) ExecuteSegmentCalculation(segmentID int64) (int64, error) {
	// 获取分群定义
	segment, err := s.segmentRepo.GetSegmentByID(segmentID)
	if err != nil {
		return 0, err
	}

	// 解析分群条件
	// TODO: 实现复杂的分群条件解析和计算逻辑
	// 这里简化处理，假设条件是标签条件
	tagConditions := make(map[string]string)
	for k, v := range segment.ConditionJSON {
		if strV, ok := v.(string); ok {
			tagConditions[k] = strV
		}
	}

	// 根据标签条件查询玩家
	playerIDs, err := s.tagRepo.QueryPlayerIDsByTags(tagConditions, segment.GameID)
	if err != nil {
		return 0, err
	}

	// 清空旧的分群玩家
	if err := s.segmentRepo.ClearSegmentPlayers(segmentID); err != nil {
		return 0, err
	}

	// 批量添加新的分群玩家
	if len(playerIDs) > 0 {
		if err := s.segmentRepo.BatchAddPlayersToSegment(segmentID, playerIDs, segment.GameID); err != nil {
			return 0, err
		}
	}

	// 更新分群人数
	segment.EstimatedCount = int64(len(playerIDs))
	if err := s.segmentRepo.UpdateSegment(segment); err != nil {
		return 0, err
	}

	return int64(len(playerIDs)), nil
}

// GetSegmentPlayers 获取分群玩家列表
func (s *segmentService) GetSegmentPlayers(segmentID int64, page, pageSize int) ([]int64, int64, error) {
	return s.segmentRepo.GetSegmentPlayers(segmentID, page, pageSize)
}
