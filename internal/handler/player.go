package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/game-marketing-platform/internal/service"
)

// PlayerHandler 玩家处理器接口
type PlayerHandler interface {
	GetPlayerBaseInfo(c *gin.Context)
	GetPlayerTags(c *gin.Context)
	AddPlayerTag(c *gin.Context)
	BatchAddPlayerTag(c *gin.Context)
	RemovePlayerTag(c *gin.Context)
	QueryPlayersByTags(c *gin.Context)
}

// playerHandler 玩家处理器实现
type playerHandler struct {
	playerService service.PlayerService
}

// NewPlayerHandler 创建玩家处理器实例
func NewPlayerHandler(playerService service.PlayerService) PlayerHandler {
	return &playerHandler{
		playerService: playerService,
	}
}

// GetPlayerBaseInfo 获取玩家基础信息
func (h *playerHandler) GetPlayerBaseInfo(c *gin.Context) {
	// 解析玩家ID
	playerIDStr := c.Param("playerId")
	playerID, err := strconv.ParseInt(playerIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	// 调用服务获取玩家信息
	player, err := h.playerService.GetPlayerBaseInfo(playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, player)
}

// GetPlayerTags 获取玩家标签列表
func (h *playerHandler) GetPlayerTags(c *gin.Context) {
	// 解析玩家ID
	playerIDStr := c.Param("playerId")
	playerID, err := strconv.ParseInt(playerIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	// 调用服务获取玩家标签
	tags, err := h.playerService.GetPlayerTags(playerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tags)
}

// AddPlayerTag 给玩家添加标签
func (h *playerHandler) AddPlayerTag(c *gin.Context) {
	// 解析玩家ID
	playerIDStr := c.Param("playerId")
	playerID, err := strconv.ParseInt(playerIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	// 解析标签参数
	tagCode := c.Query("tagCode")
	tagValue := c.Query("tagValue")
	gameID := c.Query("gameId")

	if tagCode == "" || tagValue == "" || gameID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	// 调用服务添加标签
	err = h.playerService.AddPlayerTag(playerID, tagCode, tagValue, gameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag added successfully"})
}

// BatchAddPlayerTag 批量给玩家添加标签
func (h *playerHandler) BatchAddPlayerTag(c *gin.Context) {
	// 解析请求体
	var req struct {
		PlayerIDs []int64 `json:"playerIds" binding:"required"`
		TagCode   string  `json:"tagCode" binding:"required"`
		TagValue  string  `json:"tagValue" binding:"required"`
		GameID    string  `json:"gameId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务批量添加标签
	err := h.playerService.BatchAddPlayerTag(req.PlayerIDs, req.TagCode, req.TagValue, req.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tags added successfully"})
}

// RemovePlayerTag 移除玩家标签
func (h *playerHandler) RemovePlayerTag(c *gin.Context) {
	// 解析玩家ID和标签编码
	playerIDStr := c.Param("playerId")
	playerID, err := strconv.ParseInt(playerIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid player ID"})
		return
	}

	tagCode := c.Param("tagCode")
	if tagCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing tagCode parameter"})
		return
	}

	// 调用服务移除标签
	err = h.playerService.RemovePlayerTag(playerID, tagCode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tag removed successfully"})
}

// QueryPlayersByTags 根据标签条件查询玩家
func (h *playerHandler) QueryPlayersByTags(c *gin.Context) {
	// 解析游戏ID
	gameID := c.Query("gameId")
	if gameID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing gameId parameter"})
		return
	}

	// 解析标签条件
	tagConditions := make(map[string]string)
	if err := c.ShouldBindJSON(&tagConditions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 调用服务查询玩家
	playerIDs, err := h.playerService.QueryPlayersByTags(tagConditions, gameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"player_ids": playerIDs, "count": len(playerIDs)})
}
