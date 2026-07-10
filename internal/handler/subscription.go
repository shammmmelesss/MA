package handler

import (
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

type SubscriptionHandler interface {
	CreateSubscription(c *gin.Context)
	UpdateSubscription(c *gin.Context)
	GetSubscription(c *gin.Context)
	ListSubscriptions(c *gin.Context)
	DeleteSubscription(c *gin.Context)
}

type subscriptionHandler struct {
	svc service.SubscriptionService
}

func NewSubscriptionHandler(svc service.SubscriptionService) SubscriptionHandler {
	return &subscriptionHandler{svc: svc}
}

// CreateSubscription POST /api/v1/subscriptions
func (h *subscriptionHandler) CreateSubscription(c *gin.Context) {
	var sub model.UserSubscription
	if err := c.ShouldBindJSON(&sub); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.Create(&sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sub)
}

// UpdateSubscription PUT /api/v1/subscriptions/:id
func (h *subscriptionHandler) UpdateSubscription(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var sub model.UserSubscription
	if err := c.ShouldBindJSON(&sub); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sub.ID = id
	if err := h.svc.Update(&sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sub)
}

// GetSubscription GET /api/v1/subscriptions/:id
func (h *subscriptionHandler) GetSubscription(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	sub, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sub)
}

// ListSubscriptions GET /api/v1/subscriptions?project_id=&name=&status=&type=&page=&page_size=
func (h *subscriptionHandler) ListSubscriptions(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Query("project_id"), 10, 64)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project_id is required"})
		return
	}
	name := c.Query("name")
	status := c.Query("status")
	subType := c.Query("type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	list, total, err := h.svc.List(projectID, name, status, subType, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"subscriptions": list, "total": total, "page": page, "page_size": pageSize})
}

// DeleteSubscription DELETE /api/v1/subscriptions/:id
func (h *subscriptionHandler) DeleteSubscription(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
