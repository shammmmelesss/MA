package repository

import (
	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

// ProjectRepository 项目空间仓库接口
type ProjectRepository interface {
	// 项目空间管理
	GetProjectByID(projectID int64) (*model.ProjectSpace, error)
	GetProjectByName(projectName string) (*model.ProjectSpace, error)
	CreateProject(project *model.ProjectSpace) error
	UpdateProject(project *model.ProjectSpace) error
	DeleteProject(projectID int64) error
	ListProjects(status int, page, pageSize int) ([]*model.ProjectSpace, int64, error)

	// 项目成员管理
	AddProjectMember(member *model.ProjectMember) error
	UpdateProjectMember(member *model.ProjectMember) error
	DeleteProjectMember(id int64) error
	GetProjectMembers(projectID int64) ([]*model.ProjectMember, error)
	GetUserProjects(userID string) ([]*model.ProjectSpace, error)
	IsUserInProject(userID string, projectID int64) (bool, error)
}

// projectRepository 项目空间仓库实现
type projectRepository struct {
	db *gorm.DB
}

// NewProjectRepository 创建项目空间仓库实例
func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepository{db: db}
}

// GetProjectByID 根据项目ID获取项目信息
func (r *projectRepository) GetProjectByID(projectID int64) (*model.ProjectSpace, error) {
	var project model.ProjectSpace
	result := r.db.First(&project, projectID)
	if result.Error != nil {
		return nil, result.Error
	}
	return &project, nil
}

// GetProjectByName 根据项目名称获取项目信息
func (r *projectRepository) GetProjectByName(projectName string) (*model.ProjectSpace, error) {
	var project model.ProjectSpace
	result := r.db.Where("project_name = ?", projectName).First(&project)
	if result.Error != nil {
		return nil, result.Error
	}
	return &project, nil
}

// CreateProject 创建项目空间
func (r *projectRepository) CreateProject(project *model.ProjectSpace) error {
	return r.db.Create(project).Error
}

// UpdateProject 更新项目空间
func (r *projectRepository) UpdateProject(project *model.ProjectSpace) error {
	return r.db.Save(project).Error
}

// DeleteProject 删除项目空间
func (r *projectRepository) DeleteProject(projectID int64) error {
	// 使用事务删除相关数据
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 删除项目成员
		if err := tx.Delete(&model.ProjectMember{}, "project_id = ?", projectID).Error; err != nil {
			return err
		}
		// 删除项目空间
		return tx.Delete(&model.ProjectSpace{}, projectID).Error
	})
}

// ListProjects 列出项目空间
func (r *projectRepository) ListProjects(status int, page, pageSize int) ([]*model.ProjectSpace, int64, error) {
	var projects []*model.ProjectSpace
	var total int64

	query := r.db.Model(&model.ProjectSpace{})

	// 添加查询条件
	if status != -1 {
		query = query.Where("status = ?", status)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("create_time DESC").Find(&projects).Error; err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

// AddProjectMember 添加项目成员
func (r *projectRepository) AddProjectMember(member *model.ProjectMember) error {
	return r.db.Create(member).Error
}

// UpdateProjectMember 更新项目成员
func (r *projectRepository) UpdateProjectMember(member *model.ProjectMember) error {
	return r.db.Save(member).Error
}

// DeleteProjectMember 删除项目成员
func (r *projectRepository) DeleteProjectMember(id int64) error {
	return r.db.Delete(&model.ProjectMember{}, id).Error
}

// GetProjectMembers 获取项目成员列表
func (r *projectRepository) GetProjectMembers(projectID int64) ([]*model.ProjectMember, error) {
	var members []*model.ProjectMember
	result := r.db.Where("project_id = ?", projectID).Find(&members)
	if result.Error != nil {
		return nil, result.Error
	}
	return members, nil
}

// GetUserProjects 获取用户所属的项目列表
func (r *projectRepository) GetUserProjects(userID string) ([]*model.ProjectSpace, error) {
	var projects []*model.ProjectSpace
	result := r.db.Table("project_space").
		Joins("JOIN project_member ON project_space.project_id = project_member.project_id").
		Where("project_member.user_id = ?", userID).
		Find(&projects)
	if result.Error != nil {
		return nil, result.Error
	}
	return projects, nil
}

// IsUserInProject 检查用户是否在项目中
func (r *projectRepository) IsUserInProject(userID string, projectID int64) (bool, error) {
	var count int64
	result := r.db.Model(&model.ProjectMember{}).
		Where("user_id = ? AND project_id = ?", userID, projectID).
		Count(&count)
	if result.Error != nil {
		return false, result.Error
	}
	return count > 0, nil
}
