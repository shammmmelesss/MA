package main

import (
	"fmt"
	"log"

	"github.com/game-marketing-platform/internal/config"
	"github.com/game-marketing-platform/internal/handler"
	"github.com/game-marketing-platform/internal/repository"
	"github.com/game-marketing-platform/internal/service"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 打印配置信息用于调试
	log.Printf("Config loaded: Database=%+v", cfg.Database)

	// 初始化数据库连接
	db, err := repository.NewPostgresDB(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 初始化仓库层
	playerRepo := repository.NewPlayerRepository(db.GetDB())
	tagRepo := repository.NewTagRepository(db.GetDB())
	segmentRepo := repository.NewSegmentRepository(db.GetDB())
	campaignRepo := repository.NewCampaignRepository(db.GetDB())
	projectRepo := repository.NewProjectRepository(db.GetDB())
	appRepo := repository.NewAppRepository(db.GetDB())

	// 初始化服务层
	playerService := service.NewPlayerService(playerRepo, tagRepo)
	segmentService := service.NewSegmentService(segmentRepo, tagRepo)
	campaignService := service.NewCampaignService(campaignRepo, segmentRepo)
	projectService := service.NewProjectService(projectRepo)
	appService := service.NewAppService(appRepo)
	tagService := service.NewTagService(tagRepo, playerRepo)

	// 初始化处理器层
	playerHandler := handler.NewPlayerHandler(playerService)
	segmentHandler := handler.NewSegmentHandler(segmentService)
	campaignHandler := handler.NewCampaignHandler(campaignService)
	projectHandler := handler.NewProjectHandler(projectService)
	appHandler := handler.NewAppHandler(appService)
	tagHandler := handler.NewTagHandler(tagService)

	r := gin.Default()

	// 添加CORS中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 设置路由
	api := r.Group("/api/v1")
	{
		// 项目空间相关路由
		projects := api.Group("/projects")
		{
			// 项目空间管理
			projects.POST("", projectHandler.CreateProject)
			projects.GET("", projectHandler.ListProjects)
			projects.GET("/:projectId", projectHandler.GetProject)
			projects.PUT("/:projectId", projectHandler.UpdateProject)
			projects.DELETE("/:projectId", projectHandler.DeleteProject)

			// 项目成员管理
			projects.POST("/members", projectHandler.AddProjectMember)
			projects.PUT("/members/:memberId", projectHandler.UpdateProjectMember)
			projects.DELETE("/members/:memberId", projectHandler.DeleteProjectMember)
			projects.GET("/:projectId/members", projectHandler.GetProjectMembers)
			projects.GET("/user", projectHandler.GetUserProjects)
			projects.GET("/check", projectHandler.IsUserInProject)
		}

		// App接入相关路由
		apps := api.Group("/apps")
		{
			// App基础信息管理
			apps.POST("", appHandler.CreateApp)
			apps.GET("", appHandler.ListApps)
			apps.GET("/:app_id", appHandler.GetAppInfo)
			apps.PUT("/:app_id", appHandler.UpdateApp)
			apps.DELETE("/:app_id", appHandler.DeleteApp)
			apps.POST("/:app_id/submit-review", appHandler.SubmitAppForReview)
			apps.POST("/:app_id/approve", appHandler.ApproveApp)
			apps.POST("/:app_id/reject", appHandler.RejectApp)
			apps.POST("/:app_id/enable", appHandler.EnableApp)
			apps.POST("/:app_id/disable", appHandler.DisableApp)

			// App接入鉴权管理
			apps.GET("/:app_id/auth", appHandler.GetAppAuth)
			apps.POST("/:app_id/auth/reset", appHandler.ResetAppAuth)
			apps.PUT("/:app_id/auth/ip-whitelist", appHandler.UpdateIPWhitelist)
			apps.POST("/auth/verify", appHandler.VerifyAppAuth)

			// 推送渠道配置管理
			apps.PUT("/channel-config", appHandler.CreateOrUpdateChannelConfig)
			apps.GET("/:app_id/channel-config", appHandler.GetChannelConfig)
			apps.POST("/:app_id/channel-config/enable", appHandler.EnableChannelConfig)
			apps.POST("/:app_id/channel-config/disable", appHandler.DisableChannelConfig)
			apps.POST("/channel-config/test", appHandler.TestPushChannel)

			// 设备信息管理
			apps.POST("/device/report", appHandler.ReportDevice)
			apps.GET("/:app_id/devices/subscriber/:subscriber_id", appHandler.GetDevicesBySubscriberID)
			apps.GET("/:app_id/devices", appHandler.GetDevicesByAppID)
			apps.PUT("/:app_id/devices/:device_token/status", appHandler.UpdateDeviceTokenStatus)
			apps.POST("/:app_id/devices/cleanup", appHandler.CleanupInactiveDevices)

			// 鉴权日志管理
			apps.GET("/auth-logs", appHandler.ListAuthLogs)
		}

		// 玩家画像相关路由
		profile := api.Group("/profile")
		{
			profile.GET("/players/:playerId/base", playerHandler.GetPlayerBaseInfo)
			profile.GET("/players/:playerId/tags", playerHandler.GetPlayerTags)
			profile.POST("/players/:playerId/tags", playerHandler.AddPlayerTag)
			profile.POST("/players/tags/batch", playerHandler.BatchAddPlayerTag)
			profile.DELETE("/players/:playerId/tags/:tagCode", playerHandler.RemovePlayerTag)
			profile.GET("/players/query", playerHandler.QueryPlayersByTags)

			// 标签管理相关路由
			tags := profile.Group("/tags")
			{
				// 标签基础信息管理
				tags.POST("", tagHandler.CreateTag)
				tags.GET("", tagHandler.ListTags)
				tags.GET("/:tag_code", tagHandler.GetTag)
				tags.PUT("/:tag_code", tagHandler.UpdateTag)
				tags.DELETE("/:tag_code", tagHandler.DeleteTag)
				tags.POST("/:tag_code/enable", tagHandler.EnableTag)
				tags.POST("/:tag_code/disable", tagHandler.DisableTag)
				
				// 标签分类管理
				tags.POST("/categories", tagHandler.CreateTagCategory)
				tags.GET("/categories", tagHandler.ListTagCategories)
				tags.GET("/categories/:category_id", tagHandler.GetTagCategory)
				tags.PUT("/categories/:category_id", tagHandler.UpdateTagCategory)
				tags.DELETE("/categories/:category_id", tagHandler.DeleteTagCategory)
				
				// 标签规则配置管理
				tags.PUT("/rules", tagHandler.CreateOrUpdateTagRule)
				tags.GET("/rules/:tag_code", tagHandler.GetTagRule)
				tags.GET("/rules", tagHandler.ListTagRules)
				
				// 标签数据统计
				tags.GET("/:tag_code/statistics", tagHandler.GetTagStatistics)
			}

			// 分群相关路由
			profile.POST("/segments", segmentHandler.CreateSegment)
			profile.GET("/segments", segmentHandler.ListSegments)
			profile.GET("/segments/:segmentId", segmentHandler.GetSegmentById)
			profile.PUT("/segments/:segmentId", segmentHandler.UpdateSegment)
			profile.DELETE("/segments/:segmentId", segmentHandler.DeleteSegment)
			profile.POST("/segments/:segmentId/calculate", segmentHandler.ExecuteSegmentCalculation)
			profile.GET("/segments/:segmentId/players", segmentHandler.GetSegmentPlayers)
		}

		// 营销活动相关路由
		campaign := api.Group("/campaigns")
		{
			// 活动基础管理
			campaign.POST("", campaignHandler.CreateCampaign)
			campaign.GET("", campaignHandler.ListCampaigns)
			campaign.GET("/:campaignId", campaignHandler.GetCampaign)
			campaign.PUT("/:campaignId", campaignHandler.UpdateCampaign)
			campaign.DELETE("/:campaignId", campaignHandler.DeleteCampaign)

			// 活动配置管理
			campaign.POST("/:campaignId/config/:configType", campaignHandler.SetCampaignConfig)
			campaign.GET("/:campaignId/config/:configType", campaignHandler.GetCampaignConfig)

			// 活动内容管理
			campaign.POST("/content", campaignHandler.CreateCampaignContent)
			campaign.PUT("/content/:contentId", campaignHandler.UpdateCampaignContent)
			campaign.DELETE("/content/:contentId", campaignHandler.DeleteCampaignContent)

			// 活动渠道管理
			campaign.POST("/channel", campaignHandler.CreateCampaignChannel)
			campaign.PUT("/channel/:channelId", campaignHandler.UpdateCampaignChannel)
			campaign.DELETE("/channel/:channelId", campaignHandler.DeleteCampaignChannel)

			// 活动生命周期管理
			campaign.POST("/:campaignId/submit", campaignHandler.SubmitForApproval)
			campaign.POST("/:campaignId/approve", campaignHandler.ApproveCampaign)
			campaign.POST("/:campaignId/reject", campaignHandler.RejectCampaign)
			campaign.POST("/:campaignId/start", campaignHandler.StartCampaign)
			campaign.POST("/:campaignId/pause", campaignHandler.PauseCampaign)
			campaign.POST("/:campaignId/resume", campaignHandler.ResumeCampaign)
			campaign.POST("/:campaignId/complete", campaignHandler.CompleteCampaign)
			campaign.POST("/:campaignId/cancel", campaignHandler.CancelCampaign)

			// 活动执行
			campaign.POST("/:campaignId/execute", campaignHandler.ExecuteCampaign)
		}
	}

	// 启动服务器
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
