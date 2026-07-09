package handler

import (
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

// TopicHandler topic 处理器接口
type TopicHandler interface {
	CreateTopic(c *gin.Context)
	UpdateTopic(c *gin.Context)
	GetTopic(c *gin.Context)
	ListTopics(c *gin.Context)
	DeleteTopic(c *gin.Context)

	Subscribe(c *gin.Context)
	Unsubscribe(c *gin.Context)
	GetUserSubscriptions(c *gin.Context)

	ExecuteTopicPush(c *gin.Context)
}

type topicHandler struct {
	topicService service.TopicService
}

func NewTopicHandler(topicService service.TopicService) TopicHandler {
	return &topicHandler{topicService: topicService}
}

// CreateTopic POST /api/v1/topics
func (h *topicHandler) CreateTopic(c *gin.Context) {
	var topic model.TopicDefinition
	if err := c.ShouldBindJSON(&topic); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.topicService.CreateTopic(&topic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, topic)
}

// UpdateTopic PUT /api/v1/topics/:id
func (h *topicHandler) UpdateTopic(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var topic model.TopicDefinition
	if err := c.ShouldBindJSON(&topic); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	topic.ID = id
	if err := h.topicService.UpdateTopic(&topic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, topic)
}

// GetTopic GET /api/v1/topics/:id
func (h *topicHandler) GetTopic(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	topic, err := h.topicService.GetTopic(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, topic)
}

// ListTopics GET /api/v1/topics?project_id=&page=&page_size=
func (h *topicHandler) ListTopics(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Query("project_id"), 10, 64)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project_id is required"})
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	topics, total, err := h.topicService.ListTopics(projectID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"topics": topics, "total": total, "page": page, "page_size": pageSize})
}

// DeleteTopic DELETE /api/v1/topics/:id
func (h *topicHandler) DeleteTopic(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.topicService.DeleteTopic(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// Subscribe POST /api/v1/topics/:key/subscribe
func (h *topicHandler) Subscribe(c *gin.Context) {
	topicKey := c.Param("key")
	var req struct {
		ProjectID int64  `json:"project_id" binding:"required"`
		AccountID string `json:"account_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.topicService.Subscribe(req.ProjectID, topicKey, req.AccountID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "subscribed"})
}

// Unsubscribe POST /api/v1/topics/:key/unsubscribe
func (h *topicHandler) Unsubscribe(c *gin.Context) {
	topicKey := c.Param("key")
	var req struct {
		ProjectID int64  `json:"project_id" binding:"required"`
		AccountID string `json:"account_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.topicService.Unsubscribe(req.ProjectID, topicKey, req.AccountID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "unsubscribed"})
}

// GetUserSubscriptions GET /api/v1/topics/subscriptions?project_id=&account_id=
func (h *topicHandler) GetUserSubscriptions(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Query("project_id"), 10, 64)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project_id is required"})
		return
	}
	accountID := c.Query("account_id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "account_id is required"})
		return
	}
	topics, err := h.topicService.GetUserSubscriptions(projectID, accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"topics": topics})
}

// ExecuteTopicPush POST /api/v1/topics/:key/push
// 供调试/测试发送使用，返回每个订阅用户匹配的桶和最终消息内容
func (h *topicHandler) ExecuteTopicPush(c *gin.Context) {
	topicKey := c.Param("key")
	var req struct {
		ProjectID int64                    `json:"project_id" binding:"required"`
		Buckets   []service.ContentBucket  `json:"content_buckets" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	results, err := h.topicService.ExecuteTopicPush(req.ProjectID, topicKey, req.Buckets)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"results": results, "total": len(results)})
}
