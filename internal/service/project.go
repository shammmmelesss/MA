package service

import (
	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// ProjectService 项目空间服务接口
type ProjectService interface {
	// 项目空间管理
	GetProjectByID(projectID int64) (*model.ProjectSpace, error)
	CreateProject(project *model.ProjectSpace) (int64, error)
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

// projectService 项目空间服务实现
type projectService struct {
	projectRepo repository.ProjectRepository
}

// NewProjectService 创建项目空间服务实例
func NewProjectService(projectRepo repository.ProjectRepository) ProjectService {
	return &projectService{
		projectRepo: projectRepo,
	}
}

// GetProjectByID 根据项目ID获取项目信息
func (s *projectService) GetProjectByID(projectID int64) (*model.ProjectSpace, error) {
	return s.projectRepo.GetProjectByID(projectID)
}

// CreateProject 创建项目空间
func (s *projectService) CreateProject(project *model.ProjectSpace) (int64, error) {
	// 验证项目名称
	if project.ProjectName == "" {
		return 0, ErrInvalidParameter
	}

	// 检查项目名称是否已存在
	_, err := s.projectRepo.GetProjectByName(project.ProjectName)
	if err == nil {
		return 0, ErrInvalidParameter
	}

	// 创建项目
	if err := s.projectRepo.CreateProject(project); err != nil {
		return 0, err
	}

	return project.ProjectID, nil
}

// UpdateProject 更新项目空间
func (s *projectService) UpdateProject(project *model.ProjectSpace) error {
	// 验证项目ID
	if project.ProjectID == 0 {
		return ErrInvalidParameter
	}

	// 检查项目是否存在
	_, err := s.projectRepo.GetProjectByID(project.ProjectID)
	if err != nil {
		return err
	}

	// 更新项目
	return s.projectRepo.UpdateProject(project)
}

// DeleteProject 删除项目空间
func (s *projectService) DeleteProject(projectID int64) error {
	// 验证项目ID
	if projectID == 0 {
		return ErrInvalidParameter
	}

	// 检查项目是否存在
	_, err := s.projectRepo.GetProjectByID(projectID)
	if err != nil {
		return err
	}

	// 删除项目
	return s.projectRepo.DeleteProject(projectID)
}

// ListProjects 列出项目空间
func (s *projectService) ListProjects(status int, page, pageSize int) ([]*model.ProjectSpace, int64, error) {
	return s.projectRepo.ListProjects(status, page, pageSize)
}

// AddProjectMember 添加项目成员
func (s *projectService) AddProjectMember(member *model.ProjectMember) error {
	// 验证参数
	if member.ProjectID == 0 || member.UserID == "" {
		return ErrInvalidParameter
	}

	// 检查项目是否存在
	_, err := s.projectRepo.GetProjectByID(member.ProjectID)
	if err != nil {
		return err
	}

	// 添加项目成员
	return s.projectRepo.AddProjectMember(member)
}

// UpdateProjectMember 更新项目成员
func (s *projectService) UpdateProjectMember(member *model.ProjectMember) error {
	// 验证参数
	if member.ID == 0 {
		return ErrInvalidParameter
	}

	// 更新项目成员
	return s.projectRepo.UpdateProjectMember(member)
}

// DeleteProjectMember 删除项目成员
func (s *projectService) DeleteProjectMember(id int64) error {
	// 验证参数
	if id == 0 {
		return ErrInvalidParameter
	}

	// 删除项目成员
	return s.projectRepo.DeleteProjectMember(id)
}

// GetProjectMembers 获取项目成员列表
func (s *projectService) GetProjectMembers(projectID int64) ([]*model.ProjectMember, error) {
	return s.projectRepo.GetProjectMembers(projectID)
}

// GetUserProjects 获取用户所属的项目列表
func (s *projectService) GetUserProjects(userID string) ([]*model.ProjectSpace, error) {
	return s.projectRepo.GetUserProjects(userID)
}

// IsUserInProject 检查用户是否在项目中
func (s *projectService) IsUserInProject(userID string, projectID int64) (bool, error) {
	return s.projectRepo.IsUserInProject(userID, projectID)
}
