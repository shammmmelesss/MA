package service

import (
	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// PushTaskService 推送任务服务接口
type PushTaskService interface {
	CreateTask(task *model.PushTask) (int64, error)
	UpdateTask(task *model.PushTask) error
	GetTaskByID(taskID int64) (*model.PushTask, error)
	ListTasks(projectID int64, status string, page, pageSize int) ([]*model.PushTask, int64, error)
	DeleteTask(taskID int64) error
	EstimateUsers(projectID int64, filters model.JSONB) (int64, error)
}

// pushTaskService 推送任务服务实现
type pushTaskService struct {
	pushTaskRepo repository.PushTaskRepository
}

// NewPushTaskService 创建推送任务服务实例
func NewPushTaskService(pushTaskRepo repository.PushTaskRepository) PushTaskService {
	return &pushTaskService{
		pushTaskRepo: pushTaskRepo,
	}
}

// CreateTask 创建推送任务
func (s *pushTaskService) CreateTask(task *model.PushTask) (int64, error) {
	// 校验必填字段
	if task.TaskName == "" {
		return 0, ErrInvalidParameter
	}
	if task.ProjectID == 0 {
		return 0, ErrInvalidParameter
	}
	if task.PushType == "" {
		return 0, ErrInvalidParameter
	}

	// 设置默认状态为 draft
	if task.Status == "" {
		task.Status = "draft"
	}

	if err := s.pushTaskRepo.CreatePushTask(task); err != nil {
		return 0, err
	}

	return task.TaskID, nil
}

// UpdateTask 更新推送任务
func (s *pushTaskService) UpdateTask(task *model.PushTask) error {
	// 检查任务是否存在
	existing, err := s.pushTaskRepo.GetPushTaskByID(task.TaskID)
	if err != nil {
		return err
	}

	// 只有草稿状态的任务可以编辑
	if existing.Status != "draft" {
		return ErrInvalidOperation
	}

	return s.pushTaskRepo.UpdatePushTask(task)
}

// GetTaskByID 根据任务ID获取推送任务
func (s *pushTaskService) GetTaskByID(taskID int64) (*model.PushTask, error) {
	return s.pushTaskRepo.GetPushTaskByID(taskID)
}

// ListTasks 列出推送任务
func (s *pushTaskService) ListTasks(projectID int64, status string, page, pageSize int) ([]*model.PushTask, int64, error) {
	return s.pushTaskRepo.ListPushTasks(projectID, status, page, pageSize)
}

// DeleteTask 删除推送任务（仅草稿状态可删除）
func (s *pushTaskService) DeleteTask(taskID int64) error {
	existing, err := s.pushTaskRepo.GetPushTaskByID(taskID)
	if err != nil {
		return err
	}
	if existing.Status != "draft" {
		return ErrInvalidOperation
	}
	return s.pushTaskRepo.DeletePushTask(taskID)
}

// EstimateUsers 预估目标用户数
func (s *pushTaskService) EstimateUsers(projectID int64, filters model.JSONB) (int64, error) {
	// TODO: 接入真实的用户数据查询，当前基于玩家表统计
	count, err := s.pushTaskRepo.CountPlayersByProject(projectID)
	if err != nil {
		return 0, err
	}
	return count, nil
}
