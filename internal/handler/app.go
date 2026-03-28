package handler

import (
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

// AppHandler App接入模块处理器接口
type AppHandler interface {
	// App基础信息管理
	CreateApp(c *gin.Context)
	GetAppInfo(c *gin.Context)
	ListApps(c *gin.Context)
	UpdateApp(c *gin.Context)
	DeleteApp(c *gin.Context)
	SubmitAppForReview(c *gin.Context)
	ApproveApp(c *gin.Context)
	RejectApp(c *gin.Context)
	EnableApp(c *gin.Context)
	DisableApp(c *gin.Context)

	// App接入鉴权管理
	GetAppAuth(c *gin.Context)
	ResetAppAuth(c *gin.Context)
	UpdateIPWhitelist(c *gin.Context)
	VerifyAppAuth(c *gin.Context)

	// 推送渠道配置管理
	CreateOrUpdateChannelConfig(c *gin.Context)
	GetChannelConfig(c *gin.Context)
	EnableChannelConfig(c *gin.Context)
	DisableChannelConfig(c *gin.Context)
	TestPushChannel(c *gin.Context)

	// 设备信息管理
	ReportDevice(c *gin.Context)
	GetDevicesBySubscriberID(c *gin.Context)
	GetDevicesByAppID(c *gin.Context)
	UpdateDeviceTokenStatus(c *gin.Context)
	CleanupInactiveDevices(c *gin.Context)

	// 鉴权日志管理
	ListAuthLogs(c *gin.Context)
}

// appHandler App接入模块处理器实现
type appHandler struct {
	appService service.AppService
}

// NewAppHandler 创建App接入模块处理器实例
func NewAppHandler(appService service.AppService) AppHandler {
	return &appHandler{appService: appService}
}

// App基础信息管理

// CreateApp 创建App信息
// @Summary 创建App信息
// @Description 创建新的App信息
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app body model.AppInfo true "App信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps [post]
func (h *appHandler) CreateApp(c *gin.Context) {
	var app model.AppInfo
	if err := c.ShouldBindJSON(&app); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appID, err := h.appService.CreateApp(&app)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "App created successfully",
		"app_id":  appID,
	})
}

// GetAppInfo 获取App信息
// @Summary 获取App信息
// @Description 根据AppID获取App信息
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} model.AppInfo
// @Router /api/v1/apps/{app_id} [get]
func (h *appHandler) GetAppInfo(c *gin.Context) {
	appID := c.Param("app_id")

	app, err := h.appService.GetAppInfo(appID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "App not found"})
		return
	}

	c.JSON(http.StatusOK, app)
}

// ListApps 获取App列表
// @Summary 获取App列表
// @Description 分页获取App列表，支持筛选
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Param game_name query string false "游戏名称"
// @Param app_id query string false "AppID"
// @Param package_name query string false "包名"
// @Param status query string false "状态"
// @Param platform_type query string false "平台类型"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps [get]
func (h *appHandler) ListApps(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	filter := make(map[string]interface{})
	if gameName := c.Query("game_name"); gameName != "" {
		filter["game_name LIKE ?"] = "%" + gameName + "%"
	}
	if appID := c.Query("app_id"); appID != "" {
		filter["app_id"] = appID
	}
	if packageName := c.Query("package_name"); packageName != "" {
		filter["package_name LIKE ?"] = "%" + packageName + "%"
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if platformType := c.Query("platform_type"); platformType != "" {
		filter["platform_type"] = platformType
	}

	apps, total, err := h.appService.ListApps(filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
		"apps":      apps,
	})
}

// UpdateApp 更新App信息
// @Summary 更新App信息
// @Description 根据AppID更新App信息
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param app body model.AppInfo true "App信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id} [put]
func (h *appHandler) UpdateApp(c *gin.Context) {
	appID := c.Param("app_id")
	var app model.AppInfo
	if err := c.ShouldBindJSON(&app); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	app.AppID = appID
	err := h.appService.UpdateApp(&app)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App updated successfully"})
}

// DeleteApp 删除App
// @Summary 删除App
// @Description 根据AppID删除App
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id} [delete]
func (h *appHandler) DeleteApp(c *gin.Context) {
	appID := c.Param("app_id")

	err := h.appService.DeleteApp(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App deleted successfully"})
}

// SubmitAppForReview 提交App审核
// @Summary 提交App审核
// @Description 根据AppID提交App审核
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/submit-review [post]
func (h *appHandler) SubmitAppForReview(c *gin.Context) {
	appID := c.Param("app_id")

	err := h.appService.SubmitAppForReview(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App submitted for review successfully"})
}

// ApproveApp 审核通过App
// @Summary 审核通过App
// @Description 根据AppID审核通过App
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/approve [post]
func (h *appHandler) ApproveApp(c *gin.Context) {
	appID := c.Param("app_id")

	err := h.appService.ApproveApp(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App approved successfully"})
}

// RejectApp 拒绝App审核
// @Summary 拒绝App审核
// @Description 根据AppID拒绝App审核
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param reason body map[string]string true "拒绝原因"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/reject [post]
func (h *appHandler) RejectApp(c *gin.Context) {
	appID := c.Param("app_id")
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reason := req["reason"]
	err := h.appService.RejectApp(appID, reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App rejected successfully"})
}

// EnableApp 启用App
// @Summary 启用App
// @Description 根据AppID启用App
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/enable [post]
func (h *appHandler) EnableApp(c *gin.Context) {
	appID := c.Param("app_id")

	err := h.appService.EnableApp(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App enabled successfully"})
}

// DisableApp 禁用App
// @Summary 禁用App
// @Description 根据AppID禁用App
// @Tags App基础信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/disable [post]
func (h *appHandler) DisableApp(c *gin.Context) {
	appID := c.Param("app_id")

	err := h.appService.DisableApp(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "App disabled successfully"})
}

// App接入鉴权管理

// GetAppAuth 获取App鉴权信息
// @Summary 获取App鉴权信息
// @Description 根据AppID获取App鉴权信息
// @Tags App接入鉴权管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} model.AppAuth
// @Router /api/v1/apps/{app_id}/auth [get]
func (h *appHandler) GetAppAuth(c *gin.Context) {
	appID := c.Param("app_id")

	auth, err := h.appService.GetAppAuth(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, auth)
}

// ResetAppAuth 重置App鉴权信息
// @Summary 重置App鉴权信息
// @Description 根据AppID重置App鉴权信息
// @Tags App接入鉴权管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param reset_by body map[string]string true "重置人"
// @Success 200 {object} model.AppAuth
// @Router /api/v1/apps/{app_id}/auth/reset [post]
func (h *appHandler) ResetAppAuth(c *gin.Context) {
	appID := c.Param("app_id")
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resetBy := req["reset_by"]
	auth, err := h.appService.ResetAppAuth(appID, resetBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, auth)
}

// UpdateIPWhitelist 更新IP白名单
// @Summary 更新IP白名单
// @Description 根据AppID更新IP白名单
// @Tags App接入鉴权管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param ip_whitelist body map[string]string true "IP白名单"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/auth/ip-whitelist [put]
func (h *appHandler) UpdateIPWhitelist(c *gin.Context) {
	appID := c.Param("app_id")
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipWhitelist := req["ip_whitelist"]
	err := h.appService.UpdateIPWhitelist(appID, ipWhitelist)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "IP whitelist updated successfully"})
}

// VerifyAppAuth 验证App鉴权信息
// @Summary 验证App鉴权信息
// @Description 验证App鉴权信息
// @Tags App接入鉴权管理
// @Accept json
// @Produce json
// @Param access_key query string true "AccessKey"
// @Param signature query string true "签名"
// @Param request_body body string true "请求体"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/auth/verify [post]
func (h *appHandler) VerifyAppAuth(c *gin.Context) {
	accessKey := c.Query("access_key")
	signature := c.Query("signature")

	var requestBody map[string]interface{}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 将requestBody转换为字符串用于签名验证
	// 这里需要实现转换逻辑，暂时使用空字符串
	requestBodyStr := ""

	valid, auth, err := h.appService.VerifyAppAuth(accessKey, signature, requestBodyStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": valid,
		"auth":  auth,
	})
}

// 推送渠道配置管理

// CreateOrUpdateChannelConfig 创建或更新推送渠道配置
// @Summary 创建或更新推送渠道配置
// @Description 创建或更新推送渠道配置
// @Tags 推送渠道配置管理
// @Accept json
// @Produce json
// @Param config body model.AppChannelConfig true "推送渠道配置"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/channel-config [put]
func (h *appHandler) CreateOrUpdateChannelConfig(c *gin.Context) {
	var config model.AppChannelConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.appService.CreateOrUpdateChannelConfig(&config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Channel config updated successfully"})
}

// GetChannelConfig 获取推送渠道配置
// @Summary 获取推送渠道配置
// @Description 根据AppID获取推送渠道配置
// @Tags 推送渠道配置管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} model.AppChannelConfig
// @Router /api/v1/apps/{app_id}/channel-config [get]
func (h *appHandler) GetChannelConfig(c *gin.Context) {
	appID := c.Param("app_id")

	config, err := h.appService.GetChannelConfig(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

// EnableChannelConfig 启用推送渠道配置
// @Summary 启用推送渠道配置
// @Description 根据AppID启用推送渠道配置
// @Tags 推送渠道配置管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/channel-config/enable [post]
func (h *appHandler) EnableChannelConfig(c *gin.Context) {
	appID := c.Param("app_id")

	err := h.appService.EnableChannelConfig(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Channel config enabled successfully"})
}

// DisableChannelConfig 禁用推送渠道配置
// @Summary 禁用推送渠道配置
// @Description 根据AppID禁用推送渠道配置
// @Tags 推送渠道配置管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/channel-config/disable [post]
func (h *appHandler) DisableChannelConfig(c *gin.Context) {
	appID := c.Param("app_id")

	err := h.appService.DisableChannelConfig(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Channel config disabled successfully"})
}

// TestPushChannel 测试推送渠道
// @Summary 测试推送渠道
// @Description 测试推送渠道配置是否有效
// @Tags 推送渠道配置管理
// @Accept json
// @Produce json
// @Param config body model.AppChannelConfig true "推送渠道配置"
// @Param device_token body map[string]string true "设备Token"
// @Param title body map[string]string true "推送标题"
// @Param content body map[string]string true "推送内容"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/channel-config/test [post]
func (h *appHandler) TestPushChannel(c *gin.Context) {
	var req struct {
		Config      model.AppChannelConfig `json:"config"`
		DeviceToken string                 `json:"device_token"`
		Title       string                 `json:"title"`
		Content     string                 `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	success, err := h.appService.TestPushChannel(&req.Config, req.DeviceToken, req.Title, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": success})
}

// 设备信息管理

// ReportDevice 上报设备信息
// @Summary 上报设备信息
// @Description 上报设备信息
// @Tags 设备信息管理
// @Accept json
// @Produce json
// @Param device body model.DeviceInfo true "设备信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/device/report [post]
func (h *appHandler) ReportDevice(c *gin.Context) {
	var device model.DeviceInfo
	if err := c.ShouldBindJSON(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.appService.ReportDevice(&device)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device reported successfully"})
}

// GetDevicesBySubscriberID 根据玩家ID获取设备列表
// @Summary 根据玩家ID获取设备列表
// @Description 根据AppID和玩家ID获取设备列表
// @Tags 设备信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param subscriber_id path string true "玩家ID"
// @Success 200 {array} model.DeviceInfo
// @Router /api/v1/apps/{app_id}/devices/subscriber/{subscriber_id} [get]
func (h *appHandler) GetDevicesBySubscriberID(c *gin.Context) {
	appID := c.Param("app_id")
	subscriberID := c.Param("subscriber_id")

	devices, err := h.appService.GetDevicesBySubscriberID(appID, subscriberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, devices)
}

// GetDevicesByAppID 根据AppID获取设备列表
// @Summary 根据AppID获取设备列表
// @Description 根据AppID分页获取设备列表
// @Tags 设备信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/devices [get]
func (h *appHandler) GetDevicesByAppID(c *gin.Context) {
	appID := c.Param("app_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	devices, total, err := h.appService.GetDevicesByAppID(appID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
		"devices":   devices,
	})
}

// UpdateDeviceTokenStatus 更新设备Token状态
// @Summary 更新设备Token状态
// @Description 根据AppID和设备Token更新设备Token状态
// @Tags 设备信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param device_token path string true "设备Token"
// @Param status body map[string]string true "状态"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/devices/{device_token}/status [put]
func (h *appHandler) UpdateDeviceTokenStatus(c *gin.Context) {
	appID := c.Param("app_id")
	deviceToken := c.Param("device_token")
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := req["status"]
	err := h.appService.UpdateDeviceTokenStatus(appID, deviceToken, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Device token status updated successfully"})
}

// CleanupInactiveDevices 清理不活跃设备
// @Summary 清理不活跃设备
// @Description 根据AppID清理不活跃设备
// @Tags 设备信息管理
// @Accept json
// @Produce json
// @Param app_id path string true "AppID"
// @Param days body map[string]int true "天数"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/{app_id}/devices/cleanup [post]
func (h *appHandler) CleanupInactiveDevices(c *gin.Context) {
	appID := c.Param("app_id")
	var req map[string]int
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	days := req["days"]
	count, err := h.appService.CleanupInactiveDevices(appID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Inactive devices cleaned up successfully",
		"cleaned_count": count,
	})
}

// 鉴权日志管理

// ListAuthLogs 获取鉴权日志列表
// @Summary 获取鉴权日志列表
// @Description 分页获取鉴权日志列表，支持筛选
// @Tags 鉴权日志管理
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Param access_key query string false "AccessKey"
// @Param auth_result query string false "鉴权结果"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/apps/auth-logs [get]
func (h *appHandler) ListAuthLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	filter := make(map[string]interface{})
	if accessKey := c.Query("access_key"); accessKey != "" {
		filter["access_key"] = accessKey
	}
	if authResult := c.Query("auth_result"); authResult != "" {
		filter["auth_result"] = authResult
	}

	logs, total, err := h.appService.ListAuthLogs(filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
		"logs":      logs,
	})
}
