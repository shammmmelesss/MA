package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

// PushTaskHandler 推送任务处理器接口
type PushTaskHandler interface {
	CreateTask(c *gin.Context)
	UpdateTask(c *gin.Context)
	GetTask(c *gin.Context)
	ListTasks(c *gin.Context)
	DeleteTask(c *gin.Context)
	EstimateUsers(c *gin.Context)
	GetTopics(c *gin.Context)
	GetEvents(c *gin.Context)
	GetTemplates(c *gin.Context)
}

// pushTaskHandler 推送任务处理器实现
type pushTaskHandler struct {
	pushTaskService service.PushTaskService
}

// NewPushTaskHandler 创建推送任务处理器实例
func NewPushTaskHandler(pushTaskService service.PushTaskService) PushTaskHandler {
	return &pushTaskHandler{
		pushTaskService: pushTaskService,
	}
}

// CreateTask 创建推送任务
func (h *pushTaskHandler) CreateTask(c *gin.Context) {
	var task model.PushTask
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	taskID, err := h.pushTaskService.CreateTask(&task)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"task_id": taskID, "message": "Task saved as draft"})
}

// UpdateTask 更新推送任务
func (h *pushTaskHandler) UpdateTask(c *gin.Context) {
	taskIDStr := c.Param("taskId")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task model.PushTask
	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task.TaskID = taskID

	if err := h.pushTaskService.UpdateTask(&task); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
}

// GetTask 获取推送任务详情
func (h *pushTaskHandler) GetTask(c *gin.Context) {
	taskIDStr := c.Param("taskId")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	task, err := h.pushTaskService.GetTaskByID(taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, task)
}

// ListTasks 获取推送任务列表
func (h *pushTaskHandler) ListTasks(c *gin.Context) {
	projectIDStr := c.Query("project_id")
	if projectIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project_id is required"})
		return
	}
	projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
		return
	}

	status := c.Query("status")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	tasks, total, err := h.pushTaskService.ListTasks(projectID, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tasks":     tasks,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// DeleteTask 删除推送任务
func (h *pushTaskHandler) DeleteTask(c *gin.Context) {
	taskIDStr := c.Param("taskId")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	if err := h.pushTaskService.DeleteTask(taskID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// EstimateUsers 预估目标用户数
func (h *pushTaskHandler) EstimateUsers(c *gin.Context) {
	var req struct {
		ProjectID int64           `json:"project_id" binding:"required"`
		Filters   json.RawMessage `json:"filters"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 将 filters 转为 JSONB 供服务层使用
	var filters model.JSONB
	if len(req.Filters) > 0 {
		if err := json.Unmarshal(req.Filters, &filters); err != nil {
			// filters 可能是数组格式，包装为 map
			filters = model.JSONB{"filters": json.RawMessage(req.Filters)}
		}
	}

	count, err := h.pushTaskService.EstimateUsers(req.ProjectID, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"estimated_count": count})
}

// GetTopics 获取可用 topic 列表（模拟数据）
func (h *pushTaskHandler) GetTopics(c *gin.Context) {
	topics := []gin.H{
		{"id": "news", "name": "新闻资讯"},
		{"id": "promotion", "name": "活动推广"},
		{"id": "update", "name": "版本更新"},
		{"id": "event", "name": "游戏活动"},
	}
	c.JSON(http.StatusOK, gin.H{"topics": topics})
}

// GetEvents 获取可用事件列表（模拟数据）
func (h *pushTaskHandler) GetEvents(c *gin.Context) {
	events := []gin.H{
		{"id": "login", "name": "用户登录"},
		{"id": "purchase", "name": "完成购买"},
		{"id": "level_up", "name": "等级提升"},
		{"id": "tutorial_complete", "name": "完成新手引导"},
		{"id": "add_to_cart", "name": "加入购物车"},
	}
	c.JSON(http.StatusOK, gin.H{"events": events})
}

// GetTemplates 获取内容模板列表（模拟数据）
func (h *pushTaskHandler) GetTemplates(c *gin.Context) {
	templates := []gin.H{
		{"id": "random_list", "name": "文案组1"},
		{"id": "welcome", "name": "文案组2"},
		{"id": "promotion", "name": "文案组3"},
	}
	c.JSON(http.StatusOK, gin.H{"templates": templates})
}
