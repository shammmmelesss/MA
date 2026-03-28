package service

import (
	"time"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

// CampaignService 营销活动服务接口
type CampaignService interface {
	// 活动基础管理
	GetCampaignByID(campaignID int64) (*model.Campaign, error)
	CreateCampaign(campaign *model.Campaign) (int64, error)
	UpdateCampaign(campaign *model.Campaign) error
	DeleteCampaign(campaignID int64) error
	ListCampaigns(gameID string, campaignType model.CampaignType, status model.CampaignStatus, page, pageSize int) ([]*model.Campaign, int64, error)

	// 活动配置管理
	CreateOrUpdateCampaignConfig(campaignID int64, configType string, configJSON model.JSONB) error
	GetCampaignConfig(campaignID int64, configType string) (*model.CampaignConfig, error)

	// 活动渠道与内容管理
	CreateCampaignContent(content *model.CampaignContent) (int64, error)
	UpdateCampaignContent(content *model.CampaignContent) error
	DeleteCampaignContent(contentID int64) error
	CreateCampaignChannel(channel *model.CampaignChannel) error
	UpdateCampaignChannel(channel *model.CampaignChannel) error
	DeleteCampaignChannel(channelID int64) error

	// 活动生命周期管理
	SubmitCampaignForApproval(campaignID int64, approverID, approverName string) error
	ApproveCampaign(campaignID int64, approverID, comments string) error
	RejectCampaign(campaignID int64, approverID, comments string) error
	StartCampaign(campaignID int64) error
	PauseCampaign(campaignID int64) error
	ResumeCampaign(campaignID int64) error
	CompleteCampaign(campaignID int64) error
	CancelCampaign(campaignID int64) error

	// 活动执行
	ExecuteCampaign(campaignID int64) error
}

// campaignService 营销活动服务实现
type campaignService struct {
	campaignRepo repository.CampaignRepository
	segmentRepo  repository.SegmentRepository
}

// NewCampaignService 创建营销活动服务实例
func NewCampaignService(campaignRepo repository.CampaignRepository, segmentRepo repository.SegmentRepository) CampaignService {
	return &campaignService{
		campaignRepo: campaignRepo,
		segmentRepo:  segmentRepo,
	}
}

// GetCampaignByID 根据活动ID获取活动信息
func (s *campaignService) GetCampaignByID(campaignID int64) (*model.Campaign, error) {
	return s.campaignRepo.GetCampaignByID(campaignID)
}

// CreateCampaign 创建活动
func (s *campaignService) CreateCampaign(campaign *model.Campaign) (int64, error) {
	// 验证活动基本信息
	if campaign.CampaignName == "" {
		return 0, ErrInvalidParameter
	}
	if campaign.GameID == "" {
		return 0, ErrInvalidParameter
	}
	if campaign.CampaignType == "" {
		return 0, ErrInvalidParameter
	}

	// 设置默认值
	if campaign.Status == "" {
		campaign.Status = model.CampaignStatusDraft
	}
	if campaign.Priority == 0 {
		campaign.Priority = 5
	}

	// 创建活动
	err := s.campaignRepo.CreateCampaign(campaign)
	if err != nil {
		return 0, err
	}

	return campaign.CampaignID, nil
}

// UpdateCampaign 更新活动
func (s *campaignService) UpdateCampaign(campaign *model.Campaign) error {
	// 获取现有活动
	existingCampaign, err := s.campaignRepo.GetCampaignByID(campaign.CampaignID)
	if err != nil {
		return err
	}

	// 检查活动状态，只有草稿和已拒绝的活动可以编辑
	if existingCampaign.Status != model.CampaignStatusDraft && existingCampaign.Status != model.CampaignStatusCanceled {
		return ErrInvalidOperation
	}

	// 更新活动
	return s.campaignRepo.UpdateCampaign(campaign)
}

// DeleteCampaign 删除活动
func (s *campaignService) DeleteCampaign(campaignID int64) error {
	// 获取现有活动
	existingCampaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态，只有草稿、已完成和已取消的活动可以删除
	if existingCampaign.Status == model.CampaignStatusRunning || existingCampaign.Status == model.CampaignStatusPending || existingCampaign.Status == model.CampaignStatusApproved {
		return ErrInvalidOperation
	}

	// 删除活动
	return s.campaignRepo.DeleteCampaign(campaignID)
}

// ListCampaigns 列出活动
func (s *campaignService) ListCampaigns(gameID string, campaignType model.CampaignType, status model.CampaignStatus, page, pageSize int) ([]*model.Campaign, int64, error) {
	return s.campaignRepo.ListCampaigns(gameID, campaignType, status, page, pageSize)
}

// CreateOrUpdateCampaignConfig 创建或更新活动配置
func (s *campaignService) CreateOrUpdateCampaignConfig(campaignID int64, configType string, configJSON model.JSONB) error {
	// 检查活动是否存在
	_, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 查找现有配置
	existingConfig, err := s.campaignRepo.GetCampaignConfig(campaignID, configType)
	if err == nil {
		// 更新现有配置
		existingConfig.ConfigJSON = configJSON
		return s.campaignRepo.UpdateCampaignConfig(existingConfig)
	}

	// 创建新配置
	newConfig := &model.CampaignConfig{
		CampaignID: campaignID,
		ConfigType: configType,
		ConfigJSON: configJSON,
	}
	return s.campaignRepo.CreateCampaignConfig(newConfig)
}

// GetCampaignConfig 获取活动配置
func (s *campaignService) GetCampaignConfig(campaignID int64, configType string) (*model.CampaignConfig, error) {
	return s.campaignRepo.GetCampaignConfig(campaignID, configType)
}

// CreateCampaignContent 创建活动内容
func (s *campaignService) CreateCampaignContent(content *model.CampaignContent) (int64, error) {
	// 检查活动是否存在
	_, err := s.campaignRepo.GetCampaignByID(content.CampaignID)
	if err != nil {
		return 0, err
	}

	// 创建活动内容
	err = s.campaignRepo.CreateCampaignContent(content)
	if err != nil {
		return 0, err
	}

	return content.ContentID, nil
}

// UpdateCampaignContent 更新活动内容
func (s *campaignService) UpdateCampaignContent(content *model.CampaignContent) error {
	// 检查内容是否存在
	_, err := s.campaignRepo.GetCampaignContent(content.ContentID)
	if err != nil {
		return err
	}

	// 更新活动内容
	return s.campaignRepo.UpdateCampaignContent(content)
}

// DeleteCampaignContent 删除活动内容
func (s *campaignService) DeleteCampaignContent(contentID int64) error {
	// 检查内容是否存在
	_, err := s.campaignRepo.GetCampaignContent(contentID)
	if err != nil {
		return err
	}

	// 删除活动内容
	return s.campaignRepo.DeleteCampaignContent(contentID)
}

// CreateCampaignChannel 创建活动渠道
func (s *campaignService) CreateCampaignChannel(channel *model.CampaignChannel) error {
	// 检查活动是否存在
	_, err := s.campaignRepo.GetCampaignByID(channel.CampaignID)
	if err != nil {
		return err
	}

	// 检查内容是否存在
	_, err = s.campaignRepo.GetCampaignContent(channel.ContentID)
	if err != nil {
		return err
	}

	// 创建活动渠道
	return s.campaignRepo.CreateCampaignChannel(channel)
}

// UpdateCampaignChannel 更新活动渠道
func (s *campaignService) UpdateCampaignChannel(channel *model.CampaignChannel) error {
	// 检查渠道是否存在
	// 注意：这里没有直接的GetCampaignChannel方法，我们可以通过更新操作来验证
	return s.campaignRepo.UpdateCampaignChannel(channel)
}

// DeleteCampaignChannel 删除活动渠道
func (s *campaignService) DeleteCampaignChannel(channelID int64) error {
	return s.campaignRepo.DeleteCampaignChannel(channelID)
}

// SubmitCampaignForApproval 提交活动审批
func (s *campaignService) SubmitCampaignForApproval(campaignID int64, approverID, approverName string) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusDraft {
		return ErrInvalidOperation
	}

	// 更新活动状态为待审批
	campaign.Status = model.CampaignStatusPending
	if err := s.campaignRepo.UpdateCampaign(campaign); err != nil {
		return err
	}

	// 创建审批记录
	approval := &model.CampaignApproval{
		CampaignID:   campaignID,
		ApproverID:   approverID,
		ApproverName: approverName,
		Status:       "pending",
	}

	return s.campaignRepo.CreateCampaignApproval(approval)
}

// ApproveCampaign 审批通过活动
func (s *campaignService) ApproveCampaign(campaignID int64, approverID, comments string) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusPending {
		return ErrInvalidOperation
	}

	// 更新活动状态为已审批
	campaign.Status = model.CampaignStatusApproved
	if err := s.campaignRepo.UpdateCampaign(campaign); err != nil {
		return err
	}

	// 更新审批记录
	now := time.Now()
	approval, err := s.campaignRepo.GetCampaignApproval(campaignID)
	if err != nil {
		return err
	}

	approval.Status = "approved"
	approval.ApprovalTime = &now
	approval.Comments = comments

	return s.campaignRepo.UpdateCampaignApproval(approval)
}

// RejectCampaign 拒绝活动
func (s *campaignService) RejectCampaign(campaignID int64, approverID, comments string) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusPending {
		return ErrInvalidOperation
	}

	// 更新活动状态为已拒绝
	campaign.Status = model.CampaignStatusDraft
	if err := s.campaignRepo.UpdateCampaign(campaign); err != nil {
		return err
	}

	// 更新审批记录
	now := time.Now()
	approval, err := s.campaignRepo.GetCampaignApproval(campaignID)
	if err != nil {
		return err
	}

	approval.Status = "rejected"
	approval.ApprovalTime = &now
	approval.Comments = comments

	return s.campaignRepo.UpdateCampaignApproval(approval)
}

// StartCampaign 启动活动
func (s *campaignService) StartCampaign(campaignID int64) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusApproved && campaign.Status != model.CampaignStatusPaused && campaign.Status != model.CampaignStatusDraft {
		return ErrInvalidOperation
	}

	// 更新活动状态为运行中
	campaign.Status = model.CampaignStatusRunning
	// 如果是第一次启动，设置开始时间
	if campaign.StartTime.IsZero() {
		campaign.StartTime = time.Now()
	}

	return s.campaignRepo.UpdateCampaign(campaign)
}

// PauseCampaign 暂停活动
func (s *campaignService) PauseCampaign(campaignID int64) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusRunning {
		return ErrInvalidOperation
	}

	// 更新活动状态为已暂停
	campaign.Status = model.CampaignStatusPaused

	return s.campaignRepo.UpdateCampaign(campaign)
}

// ResumeCampaign 恢复活动
func (s *campaignService) ResumeCampaign(campaignID int64) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusPaused {
		return ErrInvalidOperation
	}

	// 更新活动状态为运行中
	campaign.Status = model.CampaignStatusRunning

	return s.campaignRepo.UpdateCampaign(campaign)
}

// CompleteCampaign 完成活动
func (s *campaignService) CompleteCampaign(campaignID int64) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusRunning && campaign.Status != model.CampaignStatusPaused {
		return ErrInvalidOperation
	}

	// 更新活动状态为已完成
	campaign.Status = model.CampaignStatusCompleted
	// 设置结束时间
	campaign.EndTime = time.Now()

	return s.campaignRepo.UpdateCampaign(campaign)
}

// CancelCampaign 取消活动
func (s *campaignService) CancelCampaign(campaignID int64) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态，已完成的活动不能取消
	if campaign.Status == model.CampaignStatusCompleted {
		return ErrInvalidOperation
	}

	// 更新活动状态为已取消
	campaign.Status = model.CampaignStatusCanceled
	// 如果还没有结束时间，设置结束时间
	if campaign.EndTime.IsZero() {
		campaign.EndTime = time.Now()
	}

	return s.campaignRepo.UpdateCampaign(campaign)
}

// ExecuteCampaign 执行活动
func (s *campaignService) ExecuteCampaign(campaignID int64) error {
	// 获取活动
	campaign, err := s.campaignRepo.GetCampaignByID(campaignID)
	if err != nil {
		return err
	}

	// 检查活动状态
	if campaign.Status != model.CampaignStatusRunning {
		return ErrInvalidOperation
	}

	// TODO: 实现活动执行逻辑
	// 1. 获取目标人群
	// 2. 获取活动渠道配置
	// 3. 获取活动内容
	// 4. 执行推送
	// 5. 记录执行结果

	// 这里简化处理，仅记录执行记录
	execution := &model.CampaignExecution{
		CampaignID:   campaignID,
		Status:       "success",
		TotalUsers:   0,
		SuccessUsers: 0,
		FailedUsers:  0,
	}

	return s.campaignRepo.CreateCampaignExecution(execution)
}
