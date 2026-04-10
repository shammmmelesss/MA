package repository

import (
	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

// PushTaskRepository 推送任务仓库接口
type PushTaskRepository interface {
	CreatePushTask(task *model.PushTask) error
	UpdatePushTask(task *model.PushTask) error
	GetPushTaskByID(taskID int64) (*model.PushTask, error)
	ListPushTasks(projectID int64, status string, page, pageSize int) ([]*model.PushTask, int64, error)
	DeletePushTask(taskID int64) error
	CountPlayersByProject(projectID int64) (int64, error)
}

// pushTaskRepository 推送任务仓库实现
type pushTaskRepository struct {
	db *gorm.DB
}

// NewPushTaskRepository 创建推送任务仓库实例
func NewPushTaskRepository(db *gorm.DB) PushTaskRepository {
	return &pushTaskRepository{db: db}
}

// CreatePushTask 创建推送任务
func (r *pushTaskRepository) CreatePushTask(task *model.PushTask) error {
	return r.db.Create(task).Error
}

// UpdatePushTask 更新推送任务
func (r *pushTaskRepository) UpdatePushTask(task *model.PushTask) error {
	return r.db.Save(task).Error
}

// GetPushTaskByID 根据任务ID获取推送任务
func (r *pushTaskRepository) GetPushTaskByID(taskID int64) (*model.PushTask, error) {
	var task model.PushTask
	result := r.db.First(&task, taskID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &task, nil
}

// ListPushTasks 列出推送任务
func (r *pushTaskRepository) ListPushTasks(projectID int64, status string, page, pageSize int) ([]*model.PushTask, int64, error) {
	var tasks []*model.PushTask
	var total int64

	query := r.db.Model(&model.PushTask{}).Where("project_id = ?", projectID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("create_time DESC").Find(&tasks).Error; err != nil {
		return nil, 0, err
	}

	return tasks, total, nil
}

// DeletePushTask 删除推送任务
func (r *pushTaskRepository) DeletePushTask(taskID int64) error {
	return r.db.Delete(&model.PushTask{}, taskID).Error
}

// CountPlayersByProject 统计项目下的玩家数量
func (r *pushTaskRepository) CountPlayersByProject(projectID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.PlayerBase{}).Where("project_id = ?", projectID).Count(&count).Error
	return count, err
}
