package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// TopicService topic 服务接口
type TopicService interface {
	CreateTopic(topic *model.TopicDefinition) error
	UpdateTopic(topic *model.TopicDefinition) error
	GetTopic(id int64) (*model.TopicDefinition, error)
	ListTopics(projectID int64, page, pageSize int) ([]*model.TopicDefinition, int64, error)
	DeleteTopic(id int64) error

	Subscribe(projectID int64, topicKey, accountID string) error
	Unsubscribe(projectID int64, topicKey, accountID string) error
	GetUserSubscriptions(projectID int64, accountID string) ([]*model.TopicDefinition, error)
	GetTopicSubscribers(projectID int64, topicKey string) ([]string, error)

	// ExecuteTopicPush 执行 topic 个性化推送，返回每个账户命中的桶 ID（用于测试发送调试）
	ExecuteTopicPush(projectID int64, topicKey string, buckets []ContentBucket) ([]PushResult, error)
}

// ContentBucket 内容分桶（对应 push_timing_config.content_buckets 中的单条）
type ContentBucket struct {
	BucketID    string           `json:"bucket_id"`
	Label       string           `json:"label"`
	Priority    int              `json:"priority"`
	UserFilters []UserFilter     `json:"user_filters"`
	Content     BucketContent    `json:"content"`
}

// UserFilter 单条用户过滤条件（复用 target_user_config filter 格式）
type UserFilter struct {
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    string `json:"value"`
	Logic    string `json:"logic"`
}

// BucketContent 分桶消息内容
type BucketContent struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

// PushResult 单个用户的推送结果（调试用）
type PushResult struct {
	AccountID string `json:"account_id"`
	BucketID  string `json:"bucket_id"`
	Title     string `json:"title"`
	Body      string `json:"body"`
}

type topicService struct {
	topicRepo  repository.TopicRepository
	playerRepo repository.PlayerRepository
}

func NewTopicService(topicRepo repository.TopicRepository, playerRepo repository.PlayerRepository) TopicService {
	return &topicService{topicRepo: topicRepo, playerRepo: playerRepo}
}

func (s *topicService) CreateTopic(topic *model.TopicDefinition) error {
	if topic.TopicKey == "" || topic.Name == "" || topic.ProjectID == 0 {
		return ErrInvalidParameter
	}
	// key 唯一性校验
	existing, err := s.topicRepo.GetByKey(topic.ProjectID, topic.TopicKey)
	if err == nil && existing != nil {
		return errors.New("topic_key 已存在")
	}
	topic.IsActive = true
	return s.topicRepo.Create(topic)
}

func (s *topicService) UpdateTopic(topic *model.TopicDefinition) error {
	if topic.ID == 0 {
		return ErrInvalidParameter
	}
	return s.topicRepo.Update(topic)
}

func (s *topicService) GetTopic(id int64) (*model.TopicDefinition, error) {
	return s.topicRepo.GetByID(id)
}

func (s *topicService) ListTopics(projectID int64, page, pageSize int) ([]*model.TopicDefinition, int64, error) {
	return s.topicRepo.List(projectID, page, pageSize)
}

func (s *topicService) DeleteTopic(id int64) error {
	return s.topicRepo.SoftDelete(id)
}

func (s *topicService) Subscribe(projectID int64, topicKey, accountID string) error {
	topic, err := s.topicRepo.GetByKey(projectID, topicKey)
	if err != nil {
		return fmt.Errorf("topic 不存在: %w", err)
	}
	return s.topicRepo.Subscribe(projectID, topic.ID, accountID)
}

func (s *topicService) Unsubscribe(projectID int64, topicKey, accountID string) error {
	topic, err := s.topicRepo.GetByKey(projectID, topicKey)
	if err != nil {
		return fmt.Errorf("topic 不存在: %w", err)
	}
	return s.topicRepo.Unsubscribe(projectID, topic.ID, accountID)
}

func (s *topicService) GetUserSubscriptions(projectID int64, accountID string) ([]*model.TopicDefinition, error) {
	return s.topicRepo.GetUserSubscriptions(projectID, accountID)
}

func (s *topicService) GetTopicSubscribers(projectID int64, topicKey string) ([]string, error) {
	topic, err := s.topicRepo.GetByKey(projectID, topicKey)
	if err != nil {
		return nil, err
	}
	return s.topicRepo.GetSubscribers(projectID, topic.ID)
}

// ExecuteTopicPush 遍历订阅用户，按分桶优先级匹配内容并插值变量
func (s *topicService) ExecuteTopicPush(projectID int64, topicKey string, buckets []ContentBucket) ([]PushResult, error) {
	topic, err := s.topicRepo.GetByKey(projectID, topicKey)
	if err != nil {
		return nil, fmt.Errorf("topic 不存在: %w", err)
	}

	accountIDs, err := s.topicRepo.GetSubscribers(projectID, topic.ID)
	if err != nil {
		return nil, err
	}

	// 按 priority 升序排列（数字越小越优先）
	sort.Slice(buckets, func(i, j int) bool {
		return buckets[i].Priority < buckets[j].Priority
	})

	var results []PushResult
	for _, accountID := range accountIDs {
		player, err := s.playerRepo.GetPlayerByAccountID(projectID, accountID)
		if err != nil {
			continue
		}

		playerAttrs := buildPlayerAttrs(player)
		matched := matchBucket(buckets, playerAttrs)

		title := interpolate(matched.Content.Title, playerAttrs)
		body := interpolate(matched.Content.Body, playerAttrs)

		results = append(results, PushResult{
			AccountID: accountID,
			BucketID:  matched.BucketID,
			Title:     title,
			Body:      body,
		})
	}

	return results, nil
}

// buildPlayerAttrs 将 PlayerBase 转为属性 map，用于 filter 匹配和变量插值
func buildPlayerAttrs(player *model.PlayerBase) map[string]string {
	return map[string]string{
		"username":  player.RoleName,
		"account_id": player.AccountID,
		"level":     strconv.Itoa(player.Level),
		"vip_level": strconv.Itoa(player.VipLevel),
		"gender":    strconv.Itoa(player.Gender),
	}
}

// matchBucket 按优先级依次检查，返回第一个匹配的桶；最后一个桶作为兜底
func matchBucket(buckets []ContentBucket, attrs map[string]string) ContentBucket {
	for _, b := range buckets {
		if len(b.UserFilters) == 0 {
			return b // 兜底桶（无过滤条件）
		}
		if filtersMatch(b.UserFilters, attrs) {
			return b
		}
	}
	// 若所有桶都有条件且都不匹配，返回最后一个
	return buckets[len(buckets)-1]
}

// filtersMatch 判断用户属性是否满足所有 AND 条件（简化实现，AND 逻辑）
func filtersMatch(filters []UserFilter, attrs map[string]string) bool {
	for _, f := range filters {
		val, exists := attrs[f.Field]
		if !exists {
			return false
		}
		if !evalFilter(val, f.Operator, f.Value) {
			return false
		}
	}
	return true
}

// evalFilter 对单条 filter 求值
func evalFilter(actual, operator, expected string) bool {
	switch operator {
	case "=":
		return actual == expected
	case "!=":
		return actual != expected
	case "has_value":
		return actual != ""
	case "no_value":
		return actual == ""
	case ">", ">=", "<", "<=":
		a, err1 := strconv.ParseFloat(actual, 64)
		e, err2 := strconv.ParseFloat(expected, 64)
		if err1 != nil || err2 != nil {
			return false
		}
		switch operator {
		case ">":
			return a > e
		case ">=":
			return a >= e
		case "<":
			return a < e
		case "<=":
			return a <= e
		}
	}
	return false
}

// interpolate 将 {{key}} 替换为用户属性值
func interpolate(template string, attrs map[string]string) string {
	result := template
	for k, v := range attrs {
		result = strings.ReplaceAll(result, "{{"+k+"}}", v)
	}
	return result
}

// ParseContentBuckets 从 push_timing_config JSONB 中解析分桶配置
func ParseContentBuckets(timingConfig model.JSONB) ([]ContentBucket, error) {
	raw, err := json.Marshal(timingConfig)
	if err != nil {
		return nil, err
	}
	var cfg struct {
		ContentBuckets []ContentBucket `json:"content_buckets"`
	}
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return nil, err
	}
	return cfg.ContentBuckets, nil
}
