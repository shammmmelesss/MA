package handler

import (
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

// ProjectHandler 项目空间处理器接口
type ProjectHandler interface {
	// 项目空间管理
	CreateProject(c *gin.Context)
	GetProject(c *gin.Context)
	UpdateProject(c *gin.Context)
	DeleteProject(c *gin.Context)
	ListProjects(c *gin.Context)

	// 项目成员管理
	AddProjectMember(c *gin.Context)
	UpdateProjectMember(c *gin.Context)
	DeleteProjectMember(c *gin.Context)
	GetProjectMembers(c *gin.Context)
	GetUserProjects(c *gin.Context)
	IsUserInProject(c *gin.Context)
}

// projectHandler 项目空间处理器实现
type projectHandler struct {
	projectService service.ProjectService
}

// NewProjectHandler 创建项目空间处理器实例
func NewProjectHandler(projectService service.ProjectService) ProjectHandler {
	return &projectHandler{
		projectService: projectService,
	}
}

// CreateProject 创建项目空间
func (h *projectHandler) CreateProject(c *gin.Context) {
	// 使用 map 接收请求体，避免类型绑定问题
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var project model.ProjectSpace

	if v, ok := body["project_name"].(string); ok {
		project.ProjectName = v
	}
	if v, ok := body["description"].(string); ok {
		project.Description = v
	}
	if v, ok := body["status"].(float64); ok {
		project.Status = int(v)
	}
	if v, ok := body["firebase_project_id"].(string); ok {
		project.FirebaseProjectID = v
	}
	if v, ok := body["access_key"].(string); ok {
		project.AccessKey = v
	}
	if v, ok := body["creator"].(string); ok {
		project.Creator = v
	}
	if v, ok := body["modifier"].(string); ok {
		project.Modifier = v
	}

	// 处理 project_manager（前端传的是字符串数组）
	if v, ok := body["project_manager"]; ok {
		if arr, ok := v.([]interface{}); ok {
			for _, item := range arr {
				if s, ok := item.(string); ok {
					project.ProjectManager = append(project.ProjectManager, s)
				}
			}
		}
	}

	// 处理 app_packages（前端传的是字符串数组）
	if v, ok := body["app_packages"]; ok {
		if arr, ok := v.([]interface{}); ok {
			for _, item := range arr {
				if s, ok := item.(string); ok {
					project.AppPackages = append(project.AppPackages, s)
				}
			}
		}
	}

	// 调用服务创建项目
	projectID, err := h.projectService.CreateProject(&project)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"project_id": projectID, "message": "Project created successfully"})
}

// GetProject 获取项目空间详情
func (h *projectHandler) GetProject(c *gin.Context) {
	// 解析项目ID
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// 调用服务获取项目信息
	project, err := h.projectService.GetProjectByID(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, project)
}

// UpdateProject 更新项目空间
func (h *projectHandler) UpdateProject(c *gin.Context) {
	// 解析项目ID
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// 使用 map 接收请求体，避免类型绑定问题
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var project model.ProjectSpace
	project.ProjectID = projectID

	if v, ok := body["project_name"].(string); ok {
		project.ProjectName = v
	}
	if v, ok := body["description"].(string); ok {
		project.Description = v
	}
	if v, ok := body["status"].(float64); ok {
		project.Status = int(v)
	}
	if v, ok := body["firebase_project_id"].(string); ok {
		project.FirebaseProjectID = v
	}
	if v, ok := body["access_key"].(string); ok {
		project.AccessKey = v
	}
	if v, ok := body["creator"].(string); ok {
		project.Creator = v
	}
	if v, ok := body["modifier"].(string); ok {
		project.Modifier = v
	}

	// 处理 project_manager（前端传的是字符串数组）
	if v, ok := body["project_manager"]; ok {
		if arr, ok := v.([]interface{}); ok {
			for _, item := range arr {
				if s, ok := item.(string); ok {
					project.ProjectManager = append(project.ProjectManager, s)
				}
			}
		}
	}

	// 处理 app_packages（前端传的是字符串数组）
	if v, ok := body["app_packages"]; ok {
		if arr, ok := v.([]interface{}); ok {
			for _, item := range arr {
				if s, ok := item.(string); ok {
					project.AppPackages = append(project.AppPackages, s)
				}
			}
		}
	}

	// 调用服务更新项目
	if err := h.projectService.UpdateProject(&project); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project updated successfully"})
}

// DeleteProject 删除项目空间
func (h *projectHandler) DeleteProject(c *gin.Context) {
	// 解析项目ID
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// 调用服务删除项目
	if err := h.projectService.DeleteProject(projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

// ListProjects 列出项目空间
func (h *projectHandler) ListProjects(c *gin.Context) {
	// 解析查询参数
	statusStr := c.DefaultQuery("status", "-1")
	status, _ := strconv.Atoi(statusStr)

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	// 调用服务列出项目
	projects, total, err := h.projectService.ListProjects(status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// AddProjectMember 添加项目成员
func (h *projectHandler) AddProjectMember(c *gin.Context) {
	// 解析请求体
	var member model.ProjectMember
	if err := c.ShouldBindJSON(&member); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务添加项目成员
	if err := h.projectService.AddProjectMember(&member); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project member added successfully"})
}

// UpdateProjectMember 更新项目成员
func (h *projectHandler) UpdateProjectMember(c *gin.Context) {
	// 解析成员ID
	memberIDStr := c.Param("memberId")
	memberID, err := strconv.ParseInt(memberIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	// 解析请求体
	var member model.ProjectMember
	if err := c.ShouldBindJSON(&member); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置成员ID
	member.ID = memberID

	// 调用服务更新项目成员
	if err := h.projectService.UpdateProjectMember(&member); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project member updated successfully"})
}

// DeleteProjectMember 删除项目成员
func (h *projectHandler) DeleteProjectMember(c *gin.Context) {
	// 解析成员ID
	memberIDStr := c.Param("memberId")
	memberID, err := strconv.ParseInt(memberIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	// 调用服务删除项目成员
	if err := h.projectService.DeleteProjectMember(memberID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project member deleted successfully"})
}

// GetProjectMembers 获取项目成员列表
func (h *projectHandler) GetProjectMembers(c *gin.Context) {
	// 解析项目ID
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// 调用服务获取项目成员列表
	members, err := h.projectService.GetProjectMembers(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"members": members})
}

// GetUserProjects 获取用户所属的项目列表
func (h *projectHandler) GetUserProjects(c *gin.Context) {
	// 解析用户ID
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId parameter"})
		return
	}

	// 调用服务获取用户所属的项目列表
	projects, err := h.projectService.GetUserProjects(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

// IsUserInProject 检查用户是否在项目中
func (h *projectHandler) IsUserInProject(c *gin.Context) {
	// 解析参数
	userID := c.Query("userId")
	projectIDStr := c.Query("projectId")

	if userID == "" || projectIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId or projectId parameter"})
		return
	}

	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// 调用服务检查用户是否在项目中
	isInProject, err := h.projectService.IsUserInProject(userID, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"is_in_project": isInProject})
}
