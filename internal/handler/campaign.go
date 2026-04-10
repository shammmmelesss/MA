package handler

import (
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

// CampaignHandler 营销活动处理器接口
type CampaignHandler interface {
	// 活动基础管理
	CreateCampaign(c *gin.Context)
	GetCampaign(c *gin.Context)
	UpdateCampaign(c *gin.Context)
	DeleteCampaign(c *gin.Context)
	ListCampaigns(c *gin.Context)

	// 活动配置管理
	SetCampaignConfig(c *gin.Context)
	GetCampaignConfig(c *gin.Context)

	// 活动内容管理
	CreateCampaignContent(c *gin.Context)
	UpdateCampaignContent(c *gin.Context)
	DeleteCampaignContent(c *gin.Context)

	// 活动渠道管理
	CreateCampaignChannel(c *gin.Context)
	UpdateCampaignChannel(c *gin.Context)
	DeleteCampaignChannel(c *gin.Context)

	// 活动生命周期管理
	SubmitForApproval(c *gin.Context)
	ApproveCampaign(c *gin.Context)
	RejectCampaign(c *gin.Context)
	StartCampaign(c *gin.Context)
	PauseCampaign(c *gin.Context)
	ResumeCampaign(c *gin.Context)
	CompleteCampaign(c *gin.Context)
	CancelCampaign(c *gin.Context)

	// 活动执行
	ExecuteCampaign(c *gin.Context)
}

// campaignHandler 营销活动处理器实现
type campaignHandler struct {
	campaignService service.CampaignService
}

// NewCampaignHandler 创建营销活动处理器实例
func NewCampaignHandler(campaignService service.CampaignService) CampaignHandler {
	return &campaignHandler{
		campaignService: campaignService,
	}
}

// CreateCampaign 创建活动
func (h *campaignHandler) CreateCampaign(c *gin.Context) {
	// 解析请求体
	var campaign model.Campaign
	if err := c.ShouldBindJSON(&campaign); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务创建活动
	campaignID, err := h.campaignService.CreateCampaign(&campaign)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"campaign_id": campaignID, "message": "Campaign created successfully"})
}

// GetCampaign 获取活动详情
func (h *campaignHandler) GetCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务获取活动信息
	campaign, err := h.campaignService.GetCampaignByID(campaignID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, campaign)
}

// UpdateCampaign 更新活动
func (h *campaignHandler) UpdateCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 解析请求体
	var campaign model.Campaign
	if err := c.ShouldBindJSON(&campaign); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置活动ID
	campaign.CampaignID = campaignID

	// 调用服务更新活动
	if err := h.campaignService.UpdateCampaign(&campaign); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign updated successfully"})
}

// DeleteCampaign 删除活动
func (h *campaignHandler) DeleteCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务删除活动
	if err := h.campaignService.DeleteCampaign(campaignID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign deleted successfully"})
}

// ListCampaigns 列出活动
func (h *campaignHandler) ListCampaigns(c *gin.Context) {
	// 解析查询参数
	gameID := c.Query("gameId")
	if gameID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing gameId parameter"})
		return
	}

	campaignType := model.CampaignType(c.Query("campaignType"))
	status := model.CampaignStatus(c.Query("status"))

	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	// 调用服务列出活动
	campaigns, total, err := h.campaignService.ListCampaigns(gameID, campaignType, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"campaigns": campaigns,
		"total":     total,
		"page":      page,
		"pageSize":  pageSize,
	})
}

// SetCampaignConfig 设置活动配置
func (h *campaignHandler) SetCampaignConfig(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 解析配置类型
	configType := c.Param("configType")
	if configType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing configType parameter"})
		return
	}

	// 解析请求体
	var configJSON model.JSONB
	if err := c.ShouldBindJSON(&configJSON); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务设置活动配置
	if err := h.campaignService.CreateOrUpdateCampaignConfig(campaignID, configType, configJSON); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign config updated successfully"})
}

// GetCampaignConfig 获取活动配置
func (h *campaignHandler) GetCampaignConfig(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 解析配置类型
	configType := c.Param("configType")
	if configType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing configType parameter"})
		return
	}

	// 调用服务获取活动配置
	config, err := h.campaignService.GetCampaignConfig(campaignID, configType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

// CreateCampaignContent 创建活动内容
func (h *campaignHandler) CreateCampaignContent(c *gin.Context) {
	// 解析请求体
	var content model.CampaignContent
	if err := c.ShouldBindJSON(&content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务创建活动内容
	contentID, err := h.campaignService.CreateCampaignContent(&content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"content_id": contentID, "message": "Campaign content created successfully"})
}

// UpdateCampaignContent 更新活动内容
func (h *campaignHandler) UpdateCampaignContent(c *gin.Context) {
	// 解析内容ID
	contentIDStr := c.Param("contentId")
	contentID, err := strconv.ParseInt(contentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content ID"})
		return
	}

	// 解析请求体
	var content model.CampaignContent
	if err := c.ShouldBindJSON(&content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置内容ID
	content.ContentID = contentID

	// 调用服务更新活动内容
	if err := h.campaignService.UpdateCampaignContent(&content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign content updated successfully"})
}

// DeleteCampaignContent 删除活动内容
func (h *campaignHandler) DeleteCampaignContent(c *gin.Context) {
	// 解析内容ID
	contentIDStr := c.Param("contentId")
	contentID, err := strconv.ParseInt(contentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content ID"})
		return
	}

	// 调用服务删除活动内容
	if err := h.campaignService.DeleteCampaignContent(contentID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign content deleted successfully"})
}

// CreateCampaignChannel 创建活动渠道
func (h *campaignHandler) CreateCampaignChannel(c *gin.Context) {
	// 解析请求体
	var channel model.CampaignChannel
	if err := c.ShouldBindJSON(&channel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务创建活动渠道
	if err := h.campaignService.CreateCampaignChannel(&channel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign channel created successfully"})
}

// UpdateCampaignChannel 更新活动渠道
func (h *campaignHandler) UpdateCampaignChannel(c *gin.Context) {
	// 解析渠道ID
	channelIDStr := c.Param("channelId")
	channelID, err := strconv.ParseInt(channelIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid channel ID"})
		return
	}

	// 解析请求体
	var channel model.CampaignChannel
	if err := c.ShouldBindJSON(&channel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置渠道ID
	channel.ChannelID = channelID

	// 调用服务更新活动渠道
	if err := h.campaignService.UpdateCampaignChannel(&channel); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign channel updated successfully"})
}

// DeleteCampaignChannel 删除活动渠道
func (h *campaignHandler) DeleteCampaignChannel(c *gin.Context) {
	// 解析渠道ID
	channelIDStr := c.Param("channelId")
	channelID, err := strconv.ParseInt(channelIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid channel ID"})
		return
	}

	// 调用服务删除活动渠道
	if err := h.campaignService.DeleteCampaignChannel(channelID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign channel deleted successfully"})
}

// SubmitForApproval 提交活动审批
func (h *campaignHandler) SubmitForApproval(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 解析请求体
	var req struct {
		ApproverID   string `json:"approverId" binding:"required"`
		ApproverName string `json:"approverName" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务提交审批
	if err := h.campaignService.SubmitCampaignForApproval(campaignID, req.ApproverID, req.ApproverName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign submitted for approval successfully"})
}

// ApproveCampaign 审批通过活动
func (h *campaignHandler) ApproveCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 解析请求体
	var req struct {
		ApproverID string `json:"approverId" binding:"required"`
		Comments   string `json:"comments"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务审批通过活动
	if err := h.campaignService.ApproveCampaign(campaignID, req.ApproverID, req.Comments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign approved successfully"})
}

// RejectCampaign 拒绝活动
func (h *campaignHandler) RejectCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 解析请求体
	var req struct {
		ApproverID string `json:"approverId" binding:"required"`
		Comments   string `json:"comments" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务拒绝活动
	if err := h.campaignService.RejectCampaign(campaignID, req.ApproverID, req.Comments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign rejected successfully"})
}

// StartCampaign 启动活动
func (h *campaignHandler) StartCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务启动活动
	if err := h.campaignService.StartCampaign(campaignID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign started successfully"})
}

// PauseCampaign 暂停活动
func (h *campaignHandler) PauseCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务暂停活动
	if err := h.campaignService.PauseCampaign(campaignID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign paused successfully"})
}

// ResumeCampaign 恢复活动
func (h *campaignHandler) ResumeCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务恢复活动
	if err := h.campaignService.ResumeCampaign(campaignID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign resumed successfully"})
}

// CompleteCampaign 完成活动
func (h *campaignHandler) CompleteCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务完成活动
	if err := h.campaignService.CompleteCampaign(campaignID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign completed successfully"})
}

// CancelCampaign 取消活动
func (h *campaignHandler) CancelCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务取消活动
	if err := h.campaignService.CancelCampaign(campaignID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign canceled successfully"})
}

// ExecuteCampaign 执行活动
func (h *campaignHandler) ExecuteCampaign(c *gin.Context) {
	// 解析活动ID
	campaignIDStr := c.Param("campaignId")
	campaignID, err := strconv.ParseInt(campaignIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// 调用服务执行活动
	if err := h.campaignService.ExecuteCampaign(campaignID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign executed successfully"})
}
