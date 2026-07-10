package handler

import (
	"net/http"
	"strconv"

	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

type ImageGroupHandler interface {
	ListImageGroups(c *gin.Context)
	CreateImageGroup(c *gin.Context)
	GetImageGroup(c *gin.Context)
	UpdateImageGroup(c *gin.Context)
	DeleteImageGroup(c *gin.Context)
	UploadItemImage(c *gin.Context)
}

type imageGroupHandler struct {
	svc service.ImageGroupService
}

func NewImageGroupHandler(svc service.ImageGroupService) ImageGroupHandler {
	return &imageGroupHandler{svc: svc}
}

// ListImageGroups GET /api/v1/image-groups?project_id=&name=&status=&page=&page_size=
func (h *imageGroupHandler) ListImageGroups(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Query("project_id"), 10, 64)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "project_id is required"})
		return
	}
	name := c.Query("name")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	list, total, err := h.svc.List(projectID, name, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"list": list, "total": total, "page": page, "page_size": pageSize})
}

// CreateImageGroup POST /api/v1/image-groups
func (h *imageGroupHandler) CreateImageGroup(c *gin.Context) {
	var req struct {
		ProjectID int64             `json:"project_id" binding:"required"`
		Name      string            `json:"name" binding:"required"`
		ImageType string            `json:"image_type" binding:"required"`
		Status    string            `json:"status"`
		CreatedBy string            `json:"created_by"`
		Items     []model.ImageItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	g := &model.ImageGroup{
		ProjectID: req.ProjectID,
		Name:      req.Name,
		ImageType: req.ImageType,
		Status:    req.Status,
		CreatedBy: req.CreatedBy,
	}
	if g.Status == "" {
		g.Status = "enabled"
	}

	if err := h.svc.Create(g); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(req.Items) > 0 {
		if err := h.svc.SaveItems(g.ID, req.Items); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	result, _ := h.svc.GetByID(g.ID)
	c.JSON(http.StatusOK, result)
}

// GetImageGroup GET /api/v1/image-groups/:id
func (h *imageGroupHandler) GetImageGroup(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	g, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
		return
	}
	c.JSON(http.StatusOK, g)
}

// UpdateImageGroup PUT /api/v1/image-groups/:id
func (h *imageGroupHandler) UpdateImageGroup(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req struct {
		Name      string            `json:"name"`
		ImageType string            `json:"image_type"`
		Status    string            `json:"status"`
		UpdatedBy string            `json:"updated_by"`
		Items     []model.ImageItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	g, err := h.svc.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
		return
	}

	if req.Name != "" {
		g.Name = req.Name
	}
	if req.ImageType != "" {
		g.ImageType = req.ImageType
	}
	if req.Status != "" {
		g.Status = req.Status
	}
	g.UpdatedBy = req.UpdatedBy
	// Clear items from preload to avoid re-insert via gorm association
	g.Items = nil

	if err := h.svc.Update(g); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if req.Items != nil {
		if err := h.svc.SaveItems(id, req.Items); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	result, _ := h.svc.GetByID(id)
	c.JSON(http.StatusOK, result)
}

// DeleteImageGroup DELETE /api/v1/image-groups/:id
func (h *imageGroupHandler) DeleteImageGroup(c *gin.Context) {
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

// UploadItemImage POST /api/v1/image-groups/upload-image
func (h *imageGroupHandler) UploadItemImage(c *gin.Context) {
	groupIDStr := c.PostForm("group_id")
	var groupID int64
	if groupIDStr != "" {
		groupID, _ = strconv.ParseInt(groupIDStr, 10, 64)
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		return
	}
	defer file.Close()

	url, err := h.svc.UploadItemImage(groupID, file, fileHeader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}
