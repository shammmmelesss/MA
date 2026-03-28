package repository

import (
	"time"

	"github.com/game-marketing-platform/internal/model"
	"gorm.io/gorm"
)

// AppRepository App接入模块仓库接口
type AppRepository interface {
	// App基础信息管理
	CreateApp(app *model.AppInfo) error
	GetAppByID(appID string) (*model.AppInfo, error)
	GetAppByPackageName(packageName string) (*model.AppInfo, error)
	ListApps(filter map[string]interface{}, page, pageSize int) ([]*model.AppInfo, int64, error)
	UpdateApp(app *model.AppInfo) error
	DeleteApp(appID string) error
	ChangeAppStatus(appID, status string) error

	// App接入鉴权管理
	CreateAppAuth(auth *model.AppAuth) error
	GetAppAuth(appID string) (*model.AppAuth, error)
	GetAppAuthByAccessKey(accessKey string) (*model.AppAuth, error)
	UpdateAppAuth(auth *model.AppAuth) error
	ResetAppAuth(appID, resetBy string) (*model.AppAuth, error)
	UpdateIPWhitelist(appID, ipWhitelist string) error

	// 推送渠道配置管理
	CreateAppChannelConfig(config *model.AppChannelConfig) error
	GetAppChannelConfig(appID string) (*model.AppChannelConfig, error)
	UpdateAppChannelConfig(config *model.AppChannelConfig) error
	ChangeChannelConfigStatus(appID, status string) error

	// 设备信息管理
	CreateDevice(device *model.DeviceInfo) error
	UpdateDevice(device *model.DeviceInfo) error
	GetDeviceByToken(appID, deviceToken string) (*model.DeviceInfo, error)
	GetDevicesBySubscriberID(appID, subscriberID string) ([]*model.DeviceInfo, error)
	GetDevicesByAppID(appID string, page, pageSize int) ([]*model.DeviceInfo, int64, error)
	UpdateDeviceTokenStatus(appID, deviceToken, status string) error
	CleanupInactiveDevices(appID string, days int) (int64, error)

	// 鉴权日志管理
	CreateAuthLog(log *model.AuthLog) error
	ListAuthLogs(filter map[string]interface{}, page, pageSize int) ([]*model.AuthLog, int64, error)
}

// appRepository App接入模块仓库实现
type appRepository struct {
	db *gorm.DB
}

// NewAppRepository 创建App接入模块仓库实例
func NewAppRepository(db *gorm.DB) AppRepository {
	return &appRepository{db: db}
}

// App基础信息管理

// CreateApp 创建App信息
func (r *appRepository) CreateApp(app *model.AppInfo) error {
	return r.db.Create(app).Error
}

// GetAppByID 根据AppID获取App信息
func (r *appRepository) GetAppByID(appID string) (*model.AppInfo, error) {
	var app model.AppInfo
	err := r.db.Where("app_id = ? AND is_deleted = ?", appID, false).First(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

// GetAppByPackageName 根据包名获取App信息
func (r *appRepository) GetAppByPackageName(packageName string) (*model.AppInfo, error) {
	var app model.AppInfo
	err := r.db.Where("package_name = ? AND is_deleted = ?", packageName, false).First(&app).Error
	if err != nil {
		return nil, err
	}
	return &app, nil
}

// ListApps 分页获取App列表
func (r *appRepository) ListApps(filter map[string]interface{}, page, pageSize int) ([]*model.AppInfo, int64, error) {
	var apps []*model.AppInfo
	var total int64

	query := r.db.Model(&model.AppInfo{}).Where("is_deleted = ?", false)

	// 应用筛选条件
	for key, value := range filter {
		query = query.Where(key, value)
	}

	// 获取总数
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Order("create_time DESC").Find(&apps).Error
	if err != nil {
		return nil, 0, err
	}

	return apps, total, nil
}

// UpdateApp 更新App信息
func (r *appRepository) UpdateApp(app *model.AppInfo) error {
	return r.db.Save(app).Error
}

// DeleteApp 删除App（逻辑删除）
func (r *appRepository) DeleteApp(appID string) error {
	return r.db.Model(&model.AppInfo{}).Where("app_id = ?", appID).Update("is_deleted", true).Error
}

// ChangeAppStatus 变更App状态
func (r *appRepository) ChangeAppStatus(appID, status string) error {
	return r.db.Model(&model.AppInfo{}).Where("app_id = ?", appID).Update("status", status).Error
}

// App接入鉴权管理

// CreateAppAuth 创建App鉴权信息
func (r *appRepository) CreateAppAuth(auth *model.AppAuth) error {
	return r.db.Create(auth).Error
}

// GetAppAuth 根据AppID获取鉴权信息
func (r *appRepository) GetAppAuth(appID string) (*model.AppAuth, error) {
	var auth model.AppAuth
	err := r.db.Where("app_id = ?", appID).First(&auth).Error
	if err != nil {
		return nil, err
	}
	return &auth, nil
}

// GetAppAuthByAccessKey 根据AccessKey获取鉴权信息
func (r *appRepository) GetAppAuthByAccessKey(accessKey string) (*model.AppAuth, error) {
	var auth model.AppAuth
	err := r.db.Where("access_key = ?", accessKey).First(&auth).Error
	if err != nil {
		return nil, err
	}
	return &auth, nil
}

// UpdateAppAuth 更新鉴权信息
func (r *appRepository) UpdateAppAuth(auth *model.AppAuth) error {
	return r.db.Save(auth).Error
}

// ResetAppAuth 重置App鉴权信息
func (r *appRepository) ResetAppAuth(appID, resetBy string) (*model.AppAuth, error) {
	// 这部分需要生成新的AccessKey和SecretKey，暂时返回空实现
	// 实际实现中需要添加密钥生成逻辑
	return nil, nil
}

// UpdateIPWhitelist 更新IP白名单
func (r *appRepository) UpdateIPWhitelist(appID, ipWhitelist string) error {
	return r.db.Model(&model.AppAuth{}).Where("app_id = ?", appID).Update("ip_whitelist", ipWhitelist).Error
}

// 推送渠道配置管理

// CreateAppChannelConfig 创建推送渠道配置
func (r *appRepository) CreateAppChannelConfig(config *model.AppChannelConfig) error {
	return r.db.Create(config).Error
}

// GetAppChannelConfig 根据AppID获取推送渠道配置
func (r *appRepository) GetAppChannelConfig(appID string) (*model.AppChannelConfig, error) {
	var config model.AppChannelConfig
	err := r.db.Where("app_id = ?", appID).First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

// UpdateAppChannelConfig 更新推送渠道配置
func (r *appRepository) UpdateAppChannelConfig(config *model.AppChannelConfig) error {
	return r.db.Save(config).Error
}

// ChangeChannelConfigStatus 变更推送渠道配置状态
func (r *appRepository) ChangeChannelConfigStatus(appID, status string) error {
	return r.db.Model(&model.AppChannelConfig{}).Where("app_id = ?", appID).Update("config_status", status).Error
}

// 设备信息管理

// CreateDevice 创建设备信息
func (r *appRepository) CreateDevice(device *model.DeviceInfo) error {
	return r.db.Create(device).Error
}

// UpdateDevice 更新设备信息
func (r *appRepository) UpdateDevice(device *model.DeviceInfo) error {
	return r.db.Save(device).Error
}

// GetDeviceByToken 根据Token获取设备信息
func (r *appRepository) GetDeviceByToken(appID, deviceToken string) (*model.DeviceInfo, error) {
	var device model.DeviceInfo
	err := r.db.Where("app_id = ? AND device_token = ?", appID, deviceToken).First(&device).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

// GetDevicesBySubscriberID 根据玩家ID获取设备列表
func (r *appRepository) GetDevicesBySubscriberID(appID, subscriberID string) ([]*model.DeviceInfo, error) {
	var devices []*model.DeviceInfo
	err := r.db.Where("app_id = ? AND subscriber_id = ?", appID, subscriberID).Find(&devices).Error
	if err != nil {
		return nil, err
	}
	return devices, nil
}

// GetDevicesByAppID 根据AppID获取设备列表
func (r *appRepository) GetDevicesByAppID(appID string, page, pageSize int) ([]*model.DeviceInfo, int64, error) {
	var devices []*model.DeviceInfo
	var total int64

	query := r.db.Model(&model.DeviceInfo{}).Where("app_id = ?", appID)

	// 获取总数
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Order("last_active_time DESC").Find(&devices).Error
	if err != nil {
		return nil, 0, err
	}

	return devices, total, nil
}

// UpdateDeviceTokenStatus 更新设备Token状态
func (r *appRepository) UpdateDeviceTokenStatus(appID, deviceToken, status string) error {
	return r.db.Model(&model.DeviceInfo{}).Where("app_id = ? AND device_token = ?", appID, deviceToken).Update("token_status", status).Error
}

// CleanupInactiveDevices 清理不活跃设备
func (r *appRepository) CleanupInactiveDevices(appID string, days int) (int64, error) {
	// 计算不活跃时间阈值
	threshold := time.Now().AddDate(0, 0, -days)
	
	// 更新超过阈值的设备状态为inactive
	result := r.db.Model(&model.DeviceInfo{}).
		Where("app_id = ? AND last_active_time < ?", appID, threshold).
		Update("token_status", "inactive")
	
	if result.Error != nil {
		return 0, result.Error
	}
	
	return result.RowsAffected, nil
}

// 鉴权日志管理

// CreateAuthLog 创建鉴权日志
func (r *appRepository) CreateAuthLog(log *model.AuthLog) error {
	return r.db.Create(log).Error
}

// ListAuthLogs 获取鉴权日志列表
func (r *appRepository) ListAuthLogs(filter map[string]interface{}, page, pageSize int) ([]*model.AuthLog, int64, error) {
	var logs []*model.AuthLog
	var total int64

	query := r.db.Model(&model.AuthLog{})

	// 应用筛选条件
	for key, value := range filter {
		query = query.Where(key, value)
	}

	// 获取总数
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	err = query.Offset(offset).Limit(pageSize).Order("request_time DESC").Find(&logs).Error
	if err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}
