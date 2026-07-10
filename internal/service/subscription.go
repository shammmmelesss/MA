package service

import (
	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

type SubscriptionService interface {
	Create(s *model.UserSubscription) error
	Update(s *model.UserSubscription) error
	GetByID(id int64) (*model.UserSubscription, error)
	List(projectID int64, name, status, subType string, page, pageSize int) ([]*model.UserSubscription, int64, error)
	Delete(id int64) error
}

type subscriptionService struct {
	repo repository.SubscriptionRepository
}

func NewSubscriptionService(repo repository.SubscriptionRepository) SubscriptionService {
	return &subscriptionService{repo: repo}
}

func (s *subscriptionService) Create(sub *model.UserSubscription) error {
	return s.repo.Create(sub)
}

func (s *subscriptionService) Update(sub *model.UserSubscription) error {
	return s.repo.Update(sub)
}

func (s *subscriptionService) GetByID(id int64) (*model.UserSubscription, error) {
	return s.repo.GetByID(id)
}

func (s *subscriptionService) List(projectID int64, name, status, subType string, page, pageSize int) ([]*model.UserSubscription, int64, error) {
	return s.repo.List(projectID, name, status, subType, page, pageSize)
}

func (s *subscriptionService) Delete(id int64) error {
	return s.repo.Delete(id)
}
