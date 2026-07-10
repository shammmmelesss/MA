package service

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/repository"
)

type ImageGroupService interface {
	Create(g *model.ImageGroup) error
	Update(g *model.ImageGroup) error
	GetByID(id int64) (*model.ImageGroup, error)
	List(projectID int64, name, status string, page, pageSize int) ([]*model.ImageGroup, int64, error)
	Delete(id int64) error
	SaveItems(groupID int64, items []model.ImageItem) error
	GetItems(groupID int64) ([]model.ImageItem, error)
	UploadItemImage(groupID int64, file multipart.File, header *multipart.FileHeader) (string, error)
}

type imageGroupService struct {
	repo repository.ImageGroupRepository
}

func NewImageGroupService(repo repository.ImageGroupRepository) ImageGroupService {
	return &imageGroupService{repo: repo}
}

func (s *imageGroupService) Create(g *model.ImageGroup) error {
	return s.repo.Create(g)
}

func (s *imageGroupService) Update(g *model.ImageGroup) error {
	return s.repo.Update(g)
}

func (s *imageGroupService) GetByID(id int64) (*model.ImageGroup, error) {
	return s.repo.GetByID(id)
}

func (s *imageGroupService) List(projectID int64, name, status string, page, pageSize int) ([]*model.ImageGroup, int64, error) {
	return s.repo.List(projectID, name, status, page, pageSize)
}

func (s *imageGroupService) Delete(id int64) error {
	return s.repo.Delete(id)
}

func (s *imageGroupService) SaveItems(groupID int64, items []model.ImageItem) error {
	return s.repo.SaveItems(groupID, items)
}

func (s *imageGroupService) GetItems(groupID int64) ([]model.ImageItem, error) {
	return s.repo.GetItems(groupID)
}

func (s *imageGroupService) UploadItemImage(_ int64, file multipart.File, header *multipart.FileHeader) (string, error) {
	uploadDir := "./uploads/images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(header.Filename))
	savePath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(savePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	buf := make([]byte, 32*1024)
	for {
		n, readErr := file.Read(buf)
		if n > 0 {
			if _, writeErr := dst.Write(buf[:n]); writeErr != nil {
				return "", fmt.Errorf("failed to write file: %w", writeErr)
			}
		}
		if readErr != nil {
			break
		}
	}

	url := "/uploads/images/" + filename
	return url, nil
}
