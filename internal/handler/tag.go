package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/game-marketing-platform/internal/model"
	"github.com/game-marketing-platform/internal/service"
)

// TagHandler 标签管理模块处理器接口
type TagHandler interface {
	// 标签基础信息管理
	CreateTag(c *gin.Context)
	GetTag(c *gin.Context)
	ListTags(c *gin.Context)
	UpdateTag(c *gin.Context)
	EnableTag(c *gin.Context)
	DisableTag(c *gin.Context)
	DeleteTag(c *gin.Context)

	// 标签分类管理
	CreateTagCategory(c *gin.Context)
	GetTagCategory(c *gin.Context)
	ListTagCategories(c *gin.Context)
	UpdateTagCategory(c *gin.Context)
	DeleteTagCategory(c *gin.Context)

	// 标签规则配置管理
	CreateOrUpdateTagRule(c *gin.Context)
	GetTagRule(c *gin.Context)
	ListTagRules(c *gin.Context)

	// 标签数据统计
	GetTagStatistics(c *gin.Context)
}

// tagHandler 标签管理模块处理器实现
type tagHandler struct {
	tagService service.TagService
}

// NewTagHandler 创建标签管理模块处理器实例
func NewTagHandler(tagService service.TagService) TagHandler {
	return &tagHandler{tagService: tagService}
}

// CreateTag 创建标签
// @Summary 创建标签
// @Description 创建新的标签
// @Tags 标签基础信息管理
// @Accept json
// @Produce json
// @Param tag body model.TagDefinition true "标签信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tags [post]
func (h *tagHandler) CreateTag(c *gin.Context) {
	var tag model.TagDefinition
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tagCode, err := h.tagService.CreateTag(&tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Tag created successfully",
		"tag_code": tagCode,
	})
}

// GetTag 获取标签信息
// @Summary 获取标签信息
// @Description 根据标签编码获取标签信息
// @Tags 标签基础信息管理
// @Accept json
// @Produce json
// @Param tag_code path string true "标签编码"
// @Success 200 {object} model.TagDefinition
// @Router /api/v1/tags/{tag_code} [get]
func (h *tagHandler) GetTag(c *gin.Context) {
	tagCode := c.Param("tag_code")

	tag, err := h.tagService.GetTag(tagCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tag)
}

// ListTags 获取标签列表
// @Summary 获取标签列表
// @Description 分页获取标签列表，支持筛选
// @Tags 标签基础信息管理
// @Accept json
// @Produce json
// @Param project_id query int true "项目ID"
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Param tag_name query string false "标签名称"
// @Param tag_type query string false "标签类型"
// @Param is_system query int false "是否系统标签"
// @Param is_active query int false "是否启用"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tags [get]
func (h *tagHandler) ListTags(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	filter := make(map[string]interface{})
	// 获取并添加项目ID到筛选条件
	if projectID := c.Query("project_id"); projectID != "" {
		filter["project_id"] = projectID
	}
	if tagName := c.Query("tag_name"); tagName != "" {
		filter["tag_name LIKE ?"] = "%" + tagName + "%"
	}
	if tagType := c.Query("tag_type"); tagType != "" {
		filter["tag_type"] = tagType
	}
	if isSystem := c.Query("is_system"); isSystem != "" {
		filter["is_system"] = isSystem
	}
	if isActive := c.Query("is_active"); isActive != "" {
		filter["is_active"] = isActive
	}

	tags, total, err := h.tagService.ListTags(filter, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
		"tags":      tags,
	})
}

// UpdateTag 更新标签信息
// @Summary 更新标签信息
// @Description 根据标签编码更新标签信息
// @Tags 标签基础信息管理
// @Accept json
// @Produce json
// @Param tag_code path string true "标签编码"
// @Param tag body model.TagDefinition true "标签信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tags/{tag_code} [put]
func (h *tagHandler) UpdateTag(c *gin.Context) {
	tagCode := c.Param("tag_code")
	var tag model.TagDefinition
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tag.TagCode = tagCode
	err := h.tagService.UpdateTag(&tag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag updated successfully"})
}

// EnableTag 启用标签
// @Summary 启用标签
// @Description 根据标签编码启用标签
// @Tags 标签基础信息管理
// @Accept json
// @Produce json
// @Param tag_code path string true "标签编码"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tags/{tag_code}/enable [post]
func (h *tagHandler) EnableTag(c *gin.Context) {
	tagCode := c.Param("tag_code")

	err := h.tagService.EnableTag(tagCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag enabled successfully"})
}

// DisableTag 禁用标签
// @Summary 禁用标签
// @Description 根据标签编码禁用标签
// @Tags 标签基础信息管理
// @Accept json
// @Produce json
// @Param tag_code path string true "标签编码"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tags/{tag_code}/disable [post]
func (h *tagHandler) DisableTag(c *gin.Context) {
	tagCode := c.Param("tag_code")

	err := h.tagService.DisableTag(tagCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag disabled successfully"})
}

// DeleteTag 删除标签
// @Summary 删除标签
// @Description 根据标签编码删除标签（逻辑删除）
// @Tags 标签基础信息管理
// @Accept json
// @Produce json
// @Param tag_code path string true "标签编码"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tags/{tag_code} [delete]
func (h *tagHandler) DeleteTag(c *gin.Context) {
	tagCode := c.Param("tag_code")

	err := h.tagService.DeleteTag(tagCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted successfully"})
}

// CreateTagCategory 创建标签分类
// @Summary 创建标签分类
// @Description 创建新的标签分类
// @Tags 标签分类管理
// @Accept json
// @Produce json
// @Param category body map[string]interface{} true "标签分类信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-categories [post]
func (h *tagHandler) CreateTagCategory(c *gin.Context) {
	var category map[string]interface{}
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	categoryID, err := h.tagService.CreateTagCategory(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Tag category created successfully",
		"category_id": categoryID,
	})
}

// GetTagCategory 获取标签分类信息
// @Summary 获取标签分类信息
// @Description 根据分类ID获取标签分类信息
// @Tags 标签分类管理
// @Accept json
// @Produce json
// @Param category_id path string true "分类ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-categories/{category_id} [get]
func (h *tagHandler) GetTagCategory(c *gin.Context) {
	categoryID := c.Param("category_id")

	category, err := h.tagService.GetTagCategory(categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, category)
}

// ListTagCategories 获取标签分类列表
// @Summary 获取标签分类列表
// @Description 分页获取标签分类列表
// @Tags 标签分类管理
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-categories [get]
func (h *tagHandler) ListTagCategories(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	categories, total, err := h.tagService.ListTagCategories(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
		"categories": categories,
	})
}

// UpdateTagCategory 更新标签分类信息
// @Summary 更新标签分类信息
// @Description 根据分类ID更新标签分类信息
// @Tags 标签分类管理
// @Accept json
// @Produce json
// @Param category_id path string true "分类ID"
// @Param category body map[string]interface{} true "标签分类信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-categories/{category_id} [put]
func (h *tagHandler) UpdateTagCategory(c *gin.Context) {
	categoryID := c.Param("category_id")
	var category map[string]interface{}
	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.tagService.UpdateTagCategory(categoryID, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag category updated successfully"})
}

// DeleteTagCategory 删除标签分类
// @Summary 删除标签分类
// @Description 根据分类ID删除标签分类
// @Tags 标签分类管理
// @Accept json
// @Produce json
// @Param category_id path string true "分类ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-categories/{category_id} [delete]
func (h *tagHandler) DeleteTagCategory(c *gin.Context) {
	categoryID := c.Param("category_id")

	err := h.tagService.DeleteTagCategory(categoryID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag category deleted successfully"})
}

// CreateOrUpdateTagRule 创建或更新标签规则
// @Summary 创建或更新标签规则
// @Description 创建或更新标签规则
// @Tags 标签规则配置管理
// @Accept json
// @Produce json
// @Param rule body map[string]interface{} true "标签规则信息"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-rules [put]
func (h *tagHandler) CreateOrUpdateTagRule(c *gin.Context) {
	var rule map[string]interface{}
	if err := c.ShouldBindJSON(&rule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.tagService.CreateOrUpdateTagRule(rule)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag rule created/updated successfully"})
}

// GetTagRule 获取标签规则
// @Summary 获取标签规则
// @Description 根据标签编码获取标签规则
// @Tags 标签规则配置管理
// @Accept json
// @Produce json
// @Param tag_code path string true "标签编码"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-rules/{tag_code} [get]
func (h *tagHandler) GetTagRule(c *gin.Context) {
	tagCode := c.Param("tag_code")

	rule, err := h.tagService.GetTagRule(tagCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rule)
}

// ListTagRules 获取标签规则列表
// @Summary 获取标签规则列表
// @Description 分页获取标签规则列表
// @Tags 标签规则配置管理
// @Accept json
// @Produce json
// @Param page query int false "页码" default(1)
// @Param page_size query int false "每页数量" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tag-rules [get]
func (h *tagHandler) ListTagRules(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	rules, total, err := h.tagService.ListTagRules(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page":      page,
		"page_size": pageSize,
		"total":     total,
		"rules":     rules,
	})
}

// GetTagStatistics 获取标签数据统计
// @Summary 获取标签数据统计
// @Description 根据标签编码获取标签数据统计
// @Tags 标签数据统计
// @Accept json
// @Produce json
// @Param tag_code path string true "标签编码"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tags/{tag_code}/statistics [get]
func (h *tagHandler) GetTagStatistics(c *gin.Context) {
	tagCode := c.Param("tag_code")

	stats, err := h.tagService.GetTagStatistics(tagCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
