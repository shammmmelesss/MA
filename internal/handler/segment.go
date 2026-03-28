package handler

import (
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

// SegmentHandler 分群处理器接口
type SegmentHandler interface {
	CreateSegment(c *gin.Context)
	ListSegments(c *gin.Context)
	GetSegmentById(c *gin.Context)
	UpdateSegment(c *gin.Context)
	DeleteSegment(c *gin.Context)
	ExecuteSegmentCalculation(c *gin.Context)
	GetSegmentPlayers(c *gin.Context)
}

// segmentHandler 分群处理器实现
type segmentHandler struct {
	segmentService service.SegmentService
}

// NewSegmentHandler 创建分群处理器实例
func NewSegmentHandler(segmentService service.SegmentService) SegmentHandler {
	return &segmentHandler{
		segmentService: segmentService,
	}
}

// CreateSegment 创建分群
func (h *segmentHandler) CreateSegment(c *gin.Context) {
	// 解析请求体
	var segment model.SegmentDefinition
	if err := c.ShouldBindJSON(&segment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务创建分群
	segmentID, err := h.segmentService.CreateSegment(&segment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"segment_id": segmentID, "message": "Segment created successfully"})
}

// ListSegments 列出分群
func (h *segmentHandler) ListSegments(c *gin.Context) {
	// 解析查询参数
	gameID := c.Query("gameId")
	if gameID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing gameId parameter"})
		return
	}

	segmentType := c.Query("segmentType")
	status := c.Query("status")

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	// 调用服务获取分群列表
	segments, total, err := h.segmentService.ListSegments(gameID, segmentType, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"segments": segments,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetSegmentById 根据ID获取分群
func (h *segmentHandler) GetSegmentById(c *gin.Context) {
	// 解析分群ID
	segmentIDStr := c.Param("segmentId")
	segmentID, err := strconv.ParseInt(segmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid segment ID"})
		return
	}

	// 调用服务获取分群信息
	segment, err := h.segmentService.GetSegmentByID(segmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, segment)
}

// UpdateSegment 更新分群
func (h *segmentHandler) UpdateSegment(c *gin.Context) {
	// 解析分群ID
	segmentIDStr := c.Param("segmentId")
	segmentID, err := strconv.ParseInt(segmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid segment ID"})
		return
	}

	// 解析请求体
	var segment model.SegmentDefinition
	if err := c.ShouldBindJSON(&segment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置分群ID
	segment.SegmentID = segmentID

	// 调用服务更新分群
	if err := h.segmentService.UpdateSegment(&segment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Segment updated successfully"})
}

// DeleteSegment 删除分群
func (h *segmentHandler) DeleteSegment(c *gin.Context) {
	// 解析分群ID
	segmentIDStr := c.Param("segmentId")
	segmentID, err := strconv.ParseInt(segmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid segment ID"})
		return
	}

	// 调用服务删除分群
	if err := h.segmentService.DeleteSegment(segmentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Segment deleted successfully"})
}

// ExecuteSegmentCalculation 执行分群计算
func (h *segmentHandler) ExecuteSegmentCalculation(c *gin.Context) {
	// 解析分群ID
	segmentIDStr := c.Param("segmentId")
	segmentID, err := strconv.ParseInt(segmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid segment ID"})
		return
	}

	// 调用服务执行分群计算
	count, err := h.segmentService.ExecuteSegmentCalculation(segmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Segment calculation executed successfully",
		"player_count": count,
	})
}

// GetSegmentPlayers 获取分群玩家列表
func (h *segmentHandler) GetSegmentPlayers(c *gin.Context) {
	// 解析分群ID
	segmentIDStr := c.Param("segmentId")
	segmentID, err := strconv.ParseInt(segmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid segment ID"})
		return
	}

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	// 调用服务获取分群玩家列表
	playerIDs, total, err := h.segmentService.GetSegmentPlayers(segmentID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"player_ids": playerIDs,
		"total":      total,
		"page":       page,
		"pageSize":   pageSize,
	})
}
