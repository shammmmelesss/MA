package service

import (
	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// TagService 标签管理模块服务接口
type TagService interface {
	// 标签基础信息管理
	CreateTag(tag *model.TagDefinition) (string, error)
	GetTag(tagCode string) (*model.TagDefinition, error)
	ListTags(filter map[string]interface{}, page, pageSize int) ([]*model.TagDefinition, int64, error)
	UpdateTag(tag *model.TagDefinition) error
	EnableTag(tagCode string) error
	DisableTag(tagCode string) error
	DeleteTag(tagCode string) error

	// 标签分类管理
	CreateTagCategory(category map[string]interface{}) (string, error)
	GetTagCategory(categoryID string) (map[string]interface{}, error)
	ListTagCategories(page, pageSize int) ([]map[string]interface{}, int64, error)
	UpdateTagCategory(categoryID string, category map[string]interface{}) error
	DeleteTagCategory(categoryID string) error

	// 标签规则配置管理
	CreateOrUpdateTagRule(rule map[string]interface{}) error
	GetTagRule(tagCode string) (map[string]interface{}, error)
	ListTagRules(page, pageSize int) ([]map[string]interface{}, int64, error)

	// 标签数据统计
	GetTagStatistics(tagCode string) (map[string]interface{}, error)
}

// tagService 标签管理模块服务实现
type tagService struct {
	tagRepo   repository.TagRepository
	playerRepo repository.PlayerRepository
}

// NewTagService 创建标签管理模块服务实例
func NewTagService(tagRepo repository.TagRepository, playerRepo repository.PlayerRepository) TagService {
	return &tagService{
		tagRepo:   tagRepo,
		playerRepo: playerRepo,
	}
}

// CreateTag 创建标签
func (s *tagService) CreateTag(tag *model.TagDefinition) (string, error) {
	// 调用 repository 创建标签
	err := s.tagRepo.CreateTag(tag)
	if err != nil {
		return "", err
	}
	
	return tag.TagCode, nil
}

// GetTag 获取标签信息
func (s *tagService) GetTag(tagCode string) (*model.TagDefinition, error) {
	return s.tagRepo.GetTag(tagCode)
}

// ListTags 获取标签列表
func (s *tagService) ListTags(filter map[string]interface{}, page, pageSize int) ([]*model.TagDefinition, int64, error) {
	return s.tagRepo.ListTags(filter, page, pageSize)
}

// UpdateTag 更新标签信息
func (s *tagService) UpdateTag(tag *model.TagDefinition) error {
	return s.tagRepo.UpdateTag(tag)
}

// EnableTag 启用标签
func (s *tagService) EnableTag(tagCode string) error {
	return s.tagRepo.UpdateTagStatus(tagCode, 1)
}

// DisableTag 禁用标签
func (s *tagService) DisableTag(tagCode string) error {
	return s.tagRepo.UpdateTagStatus(tagCode, 0)
}

// DeleteTag 删除标签
func (s *tagService) DeleteTag(tagCode string) error {
	return s.tagRepo.DeleteTag(tagCode)
}

// CreateTagCategory 创建标签分类
func (s *tagService) CreateTagCategory(category map[string]interface{}) (string, error) {
	// 目前系统中没有专门的标签分类模型，暂时返回模拟数据
	// 实际实现中需要添加标签分类相关的模型和数据库表
	return "cat_001", nil
}

// GetTagCategory 获取标签分类信息
func (s *tagService) GetTagCategory(categoryID string) (map[string]interface{}, error) {
	// 目前系统中没有专门的标签分类模型，暂时返回模拟数据
	return map[string]interface{}{
		"category_id": categoryID,
		"category_name": "基础标签",
		"description": "基础标签分类",
		"is_active": 1,
	}, nil
}

// ListTagCategories 获取标签分类列表
func (s *tagService) ListTagCategories(page, pageSize int) ([]map[string]interface{}, int64, error) {
	// 目前系统中没有专门的标签分类模型，暂时返回模拟数据
	categories := []map[string]interface{}{
		{
			"category_id": "cat_001",
			"category_name": "基础标签",
			"description": "基础标签分类",
			"is_active": 1,
		},
		{
			"category_id": "cat_002",
			"category_name": "行为标签",
			"description": "行为标签分类",
			"is_active": 1,
		},
		{
			"category_id": "cat_003",
			"category_name": "交易标签",
			"description": "交易标签分类",
			"is_active": 1,
		},
		{
			"category_id": "cat_004",
			"category_name": "游戏专属标签",
			"description": "游戏专属标签分类",
			"is_active": 1,
		},
		{
			"category_id": "cat_005",
			"category_name": "自定义标签",
			"description": "自定义标签分类",
			"is_active": 1,
		},
	}
	
	return categories, int64(len(categories)), nil
}

// UpdateTagCategory 更新标签分类信息
func (s *tagService) UpdateTagCategory(categoryID string, category map[string]interface{}) error {
	// 目前系统中没有专门的标签分类模型，暂时返回nil
	return nil
}

// DeleteTagCategory 删除标签分类
func (s *tagService) DeleteTagCategory(categoryID string) error {
	// 目前系统中没有专门的标签分类模型，暂时返回nil
	return nil
}

// CreateOrUpdateTagRule 创建或更新标签规则
func (s *tagService) CreateOrUpdateTagRule(rule map[string]interface{}) error {
	// 目前系统中没有专门的标签规则模型，暂时返回nil
	// 实际实现中需要添加标签规则相关的模型和数据库表
	return nil
}

// GetTagRule 获取标签规则
func (s *tagService) GetTagRule(tagCode string) (map[string]interface{}, error) {
	// 目前系统中没有专门的标签规则模型，暂时返回模拟数据
	return map[string]interface{}{
		"tag_code": tagCode,
		"rule_name": "默认规则",
		"rule_content": "默认规则内容",
		"rule_type": "system",
		"is_active": 1,
	}, nil
}

// ListTagRules 获取标签规则列表
func (s *tagService) ListTagRules(page, pageSize int) ([]map[string]interface{}, int64, error) {
	// 目前系统中没有专门的标签规则模型，暂时返回空列表
	return []map[string]interface{}{}, 0, nil
}

// GetTagStatistics 获取标签数据统计
func (s *tagService) GetTagStatistics(tagCode string) (map[string]interface{}, error) {
	// 获取标签关联的玩家数量
	playerCount, err := s.tagRepo.GetTagPlayerCount(tagCode)
	if err != nil {
		return nil, err
	}
	
	return map[string]interface{}{
		"tag_code": tagCode,
		"player_count": playerCount,
		"active_count": playerCount, // 假设所有关联玩家都是活跃的
		"create_time": "2023-01-01 00:00:00",
		"update_time": "2023-01-01 00:00:00",
	}, nil
}
