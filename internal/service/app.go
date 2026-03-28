package service

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// AppService App接入模块服务接口
type AppService interface {
	// App基础信息管理
	CreateApp(app *model.AppInfo) (string, error)
	GetAppInfo(appID string) (*model.AppInfo, error)
	ListApps(filter map[string]interface{}, page, pageSize int) ([]*model.AppInfo, int64, error)
	UpdateApp(app *model.AppInfo) error
	DeleteApp(appID string) error
	SubmitAppForReview(appID string) error
	ApproveApp(appID string) error
	RejectApp(appID, reason string) error
	EnableApp(appID string) error
	DisableApp(appID string) error

	// App接入鉴权管理
	GetAppAuth(appID string) (*model.AppAuth, error)
	ResetAppAuth(appID, resetBy string) (*model.AppAuth, error)
	UpdateIPWhitelist(appID, ipWhitelist string) error
	VerifyAppAuth(accessKey, signature, requestBody string) (bool, *model.AppAuth, error)

	// 推送渠道配置管理
	CreateOrUpdateChannelConfig(config *model.AppChannelConfig) error
	GetChannelConfig(appID string) (*model.AppChannelConfig, error)
	EnableChannelConfig(appID string) error
	DisableChannelConfig(appID string) error
	TestPushChannel(config *model.AppChannelConfig, deviceToken, title, content string) (bool, error)

	// 设备信息管理
	ReportDevice(device *model.DeviceInfo) error
	GetDevicesBySubscriberID(appID, subscriberID string) ([]*model.DeviceInfo, error)
	GetDevicesByAppID(appID string, page, pageSize int) ([]*model.DeviceInfo, int64, error)
	UpdateDeviceTokenStatus(appID, deviceToken, status string) error
	CleanupInactiveDevices(appID string, days int) (int64, error)

	// 鉴权日志管理
	ListAuthLogs(filter map[string]interface{}, page, pageSize int) ([]*model.AuthLog, int64, error)
}

// appService App接入模块服务实现
type appService struct {
	appRepo repository.AppRepository
}

// NewAppService 创建App接入模块服务实例
func NewAppService(appRepo repository.AppRepository) AppService {
	return &appService{appRepo: appRepo}
}

// generateAppID 生成AppID
func generateAppID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	appID := make([]byte, 16)
	_, err := rand.Read(appID)
	if err != nil {
		// 如果随机数生成失败，使用时间戳+随机数生成
		return fmt.Sprintf("app_%d_%d", time.Now().Unix(), time.Now().UnixNano()%1000000)
	}
	for i := range appID {
		appID[i] = charset[int(appID[i])%len(charset)]
	}
	return "app_" + string(appID)
}

// generateAccessKey 生成AccessKey
func generateAccessKey() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	accessKey := make([]byte, 32)
	_, err := rand.Read(accessKey)
	if err != nil {
		// 如果随机数生成失败，使用时间戳+随机数生成
		return fmt.Sprintf("ak_%d_%d", time.Now().Unix(), time.Now().UnixNano()%1000000)
	}
	for i := range accessKey {
		accessKey[i] = charset[int(accessKey[i])%len(charset)]
	}
	return string(accessKey)
}

// generateSecretKey 生成SecretKey
func generateSecretKey() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]|;:,.<>?"
	secretKey := make([]byte, 64)
	_, err := rand.Read(secretKey)
	if err != nil {
		// 如果随机数生成失败，使用时间戳+随机数生成
		return fmt.Sprintf("sk_%d_%d", time.Now().Unix(), time.Now().UnixNano()%1000000)
	}
	for i := range secretKey {
		secretKey[i] = charset[int(secretKey[i])%len(charset)]
	}
	return string(secretKey)
}

// App基础信息管理

// CreateApp 创建App信息
func (s *appService) CreateApp(app *model.AppInfo) (string, error) {
	// 生成AppID
	app.AppID = generateAppID()
	// 设置默认状态为草稿
	app.Status = "draft"
	// 创建App信息
	err := s.appRepo.CreateApp(app)
	if err != nil {
		return "", err
	}
	return app.AppID, nil
}

// GetAppInfo 获取App信息
func (s *appService) GetAppInfo(appID string) (*model.AppInfo, error) {
	return s.appRepo.GetAppByID(appID)
}

// ListApps 获取App列表
func (s *appService) ListApps(filter map[string]interface{}, page, pageSize int) ([]*model.AppInfo, int64, error) {
	return s.appRepo.ListApps(filter, page, pageSize)
}

// UpdateApp 更新App信息
func (s *appService) UpdateApp(app *model.AppInfo) error {
	// 检查App是否存在
	existingApp, err := s.appRepo.GetAppByID(app.AppID)
	if err != nil {
		return err
	}
	
	// 只有草稿或审核拒绝状态的App可以更新核心信息
	if existingApp.Status != "draft" && existingApp.Status != "rejected" {
		// 已上线或审核中的App只能更新部分字段
		app.PackageName = existingApp.PackageName
		app.PlatformType = existingApp.PlatformType
	}
	
	return s.appRepo.UpdateApp(app)
}

// DeleteApp 删除App
func (s *appService) DeleteApp(appID string) error {
	// 检查App是否存在
	existingApp, err := s.appRepo.GetAppByID(appID)
	if err != nil {
		return err
	}
	
	// 只有草稿或审核拒绝状态的App可以删除
	if existingApp.Status != "draft" && existingApp.Status != "rejected" {
		return fmt.Errorf("only draft or rejected apps can be deleted")
	}
	
	return s.appRepo.DeleteApp(appID)
}

// SubmitAppForReview 提交App审核
func (s *appService) SubmitAppForReview(appID string) error {
	// 检查App是否存在
	existingApp, err := s.appRepo.GetAppByID(appID)
	if err != nil {
		return err
	}
	
	// 只有草稿状态的App可以提交审核
	if existingApp.Status != "draft" {
		return fmt.Errorf("only draft apps can be submitted for review")
	}
	
	// 更新App状态为审核中
	return s.appRepo.ChangeAppStatus(appID, "reviewing")
}

// ApproveApp 审核通过App
func (s *appService) ApproveApp(appID string) error {
	// 检查App是否存在
	existingApp, err := s.appRepo.GetAppByID(appID)
	if err != nil {
		return err
	}
	
	// 只有审核中状态的App可以审核通过
	if existingApp.Status != "reviewing" {
		return fmt.Errorf("only reviewing apps can be approved")
	}
	
	// 更新App状态为已上线
	err = s.appRepo.ChangeAppStatus(appID, "online")
	if err != nil {
		return err
	}
	
	// 生成App鉴权信息
	accessKey := generateAccessKey()
	secretKey := generateSecretKey()
	
	appAuth := &model.AppAuth{
		AppID:        appID,
		AccessKey:    accessKey,
		SecretKey:    secretKey,
		AuthStatus:   "enabled",
		IPWhitelist:  "",
		GenerateTime: time.Now(),
	}
	
	return s.appRepo.CreateAppAuth(appAuth)
}

// RejectApp 拒绝App审核
func (s *appService) RejectApp(appID, reason string) error {
	// 检查App是否存在
	existingApp, err := s.appRepo.GetAppByID(appID)
	if err != nil {
		return err
	}
	
	// 只有审核中状态的App可以拒绝
	if existingApp.Status != "reviewing" {
		return fmt.Errorf("only reviewing apps can be rejected")
	}
	
	// 更新App状态为审核拒绝
	return s.appRepo.ChangeAppStatus(appID, "rejected")
}

// EnableApp 启用App
func (s *appService) EnableApp(appID string) error {
	return s.appRepo.ChangeAppStatus(appID, "online")
}

// DisableApp 禁用App
func (s *appService) DisableApp(appID string) error {
	return s.appRepo.ChangeAppStatus(appID, "disabled")
}

// App接入鉴权管理

// GetAppAuth 获取App鉴权信息
func (s *appService) GetAppAuth(appID string) (*model.AppAuth, error) {
	return s.appRepo.GetAppAuth(appID)
}

// ResetAppAuth 重置App鉴权信息
func (s *appService) ResetAppAuth(appID, resetBy string) (*model.AppAuth, error) {
	// 生成新的AccessKey和SecretKey
	accessKey := generateAccessKey()
	secretKey := generateSecretKey()
	
	// 获取现有鉴权信息
	existingAuth, err := s.appRepo.GetAppAuth(appID)
	if err != nil {
		return nil, err
	}
	
	// 更新鉴权信息
	existingAuth.AccessKey = accessKey
	existingAuth.SecretKey = secretKey
	existingAuth.ResetTime = time.Now()
	existingAuth.ResetBy = resetBy
	existingAuth.AuthStatus = "enabled"
	
	err = s.appRepo.UpdateAppAuth(existingAuth)
	if err != nil {
		return nil, err
	}
	
	return existingAuth, nil
}

// UpdateIPWhitelist 更新IP白名单
func (s *appService) UpdateIPWhitelist(appID, ipWhitelist string) error {
	return s.appRepo.UpdateIPWhitelist(appID, ipWhitelist)
}

// VerifyAppAuth 验证App鉴权信息
func (s *appService) VerifyAppAuth(accessKey, signature, requestBody string) (bool, *model.AppAuth, error) {
	// 获取App鉴权信息
	auth, err := s.appRepo.GetAppAuthByAccessKey(accessKey)
	if err != nil {
		return false, nil, err
	}
	
	// 检查鉴权状态
	if auth.AuthStatus != "enabled" {
		return false, auth, fmt.Errorf("app auth is disabled")
	}
	
	// 实现签名验证逻辑：使用HMAC-SHA256算法
	h := hmac.New(sha256.New, []byte(auth.SecretKey))
	h.Write([]byte(requestBody))
	expectedSignature := hex.EncodeToString(h.Sum(nil))
	
	if expectedSignature != signature {
		return false, auth, fmt.Errorf("invalid signature")
	}
	
	return true, auth, nil
}

// 推送渠道配置管理

// CreateOrUpdateChannelConfig 创建或更新渠道配置
func (s *appService) CreateOrUpdateChannelConfig(config *model.AppChannelConfig) error {
	// 检查App是否存在
	_, err := s.appRepo.GetAppByID(config.AppID)
	if err != nil {
		return err
	}
	
	// 检查是否已存在配置
	existingConfig, err := s.appRepo.GetAppChannelConfig(config.AppID)
	if err != nil {
		// 不存在则创建
		return s.appRepo.CreateAppChannelConfig(config)
	}
	
	// 存在则更新
	config.ID = existingConfig.ID
	config.ConfigUpdateTime = time.Now()
	return s.appRepo.UpdateAppChannelConfig(config)
}

// GetChannelConfig 获取渠道配置
func (s *appService) GetChannelConfig(appID string) (*model.AppChannelConfig, error) {
	return s.appRepo.GetAppChannelConfig(appID)
}

// EnableChannelConfig 启用渠道配置
func (s *appService) EnableChannelConfig(appID string) error {
	return s.appRepo.ChangeChannelConfigStatus(appID, "enabled")
}

// DisableChannelConfig 禁用渠道配置
func (s *appService) DisableChannelConfig(appID string) error {
	return s.appRepo.ChangeChannelConfigStatus(appID, "disabled")
}

// TestPushChannel 测试推送渠道
func (s *appService) TestPushChannel(config *model.AppChannelConfig, deviceToken, title, content string) (bool, error) {
	// 获取App信息以确定平台类型
	appInfo, err := s.appRepo.GetAppByID(config.AppID)
	if err != nil {
		return false, err
	}
	
	// 根据配置类型选择不同的推送服务
	if appInfo.PlatformType == "Android" || appInfo.PlatformType == "双平台" {
		// 测试FCM推送
		if config.FCMConfig != "" {
			// 这里可以实现FCM测试推送逻辑
			// 例如：调用FCM API发送测试消息
			return true, nil
		}
	}
	
	if appInfo.PlatformType == "iOS" || appInfo.PlatformType == "双平台" {
		// 测试APNs推送
		if config.APNsConfig != "" {
			// 这里可以实现APNs测试推送逻辑
			// 例如：调用APNs API发送测试消息
			return true, nil
		}
	}
	
	return false, fmt.Errorf("no valid push channel configuration found")
}

// 设备信息管理

// ReportDevice 上报设备信息
func (s *appService) ReportDevice(device *model.DeviceInfo) error {
	// 检查App是否存在
	_, err := s.appRepo.GetAppByID(device.AppID)
	if err != nil {
		return err
	}
	
	// 检查设备是否已存在
	existingDevice, err := s.appRepo.GetDeviceByToken(device.AppID, device.DeviceToken)
	if err != nil {
		// 设备不存在，创建新设备
		device.CreateTime = time.Now()
		device.LastActiveTime = time.Now()
		device.TokenStatus = "active"
		return s.appRepo.CreateDevice(device)
	}
	
	// 设备已存在，更新设备信息
	existingDevice.SubscriberID = device.SubscriberID
	existingDevice.OSVersion = device.OSVersion
	existingDevice.DeviceModel = device.DeviceModel
	existingDevice.DevicePlatform = device.DevicePlatform
	existingDevice.LastActiveTime = time.Now()
	existingDevice.TokenStatus = "active"
	
	return s.appRepo.UpdateDevice(existingDevice)
}

// GetDevicesBySubscriberID 根据玩家ID获取设备列表
func (s *appService) GetDevicesBySubscriberID(appID, subscriberID string) ([]*model.DeviceInfo, error) {
	return s.appRepo.GetDevicesBySubscriberID(appID, subscriberID)
}

// GetDevicesByAppID 根据AppID获取设备列表
func (s *appService) GetDevicesByAppID(appID string, page, pageSize int) ([]*model.DeviceInfo, int64, error) {
	return s.appRepo.GetDevicesByAppID(appID, page, pageSize)
}

// UpdateDeviceTokenStatus 更新设备Token状态
func (s *appService) UpdateDeviceTokenStatus(appID, deviceToken, status string) error {
	return s.appRepo.UpdateDeviceTokenStatus(appID, deviceToken, status)
}

// CleanupInactiveDevices 清理不活跃设备
func (s *appService) CleanupInactiveDevices(appID string, days int) (int64, error) {
	// 调用repository层的方法清理不活跃设备
	// 该方法应该返回清理的设备数量
	return s.appRepo.CleanupInactiveDevices(appID, days)
}

// 鉴权日志管理

// ListAuthLogs 获取鉴权日志列表
func (s *appService) ListAuthLogs(filter map[string]interface{}, page, pageSize int) ([]*model.AuthLog, int64, error) {
	return s.appRepo.ListAuthLogs(filter, page, pageSize)
}
