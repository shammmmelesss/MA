import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from './App.jsx'

// 导入实际页面组件
const Home = () => <div>欢迎使用游戏智能化营销推送系统</div>
import ProjectList from './pages/Project/List.jsx'
import AppList from './pages/App/List.jsx'
const PlayerManagement = () => <div>玩家管理页面</div>
import TagList from './pages/Tag/List.jsx'
const SegmentManagement = () => <div>分群管理页面</div>
const CampaignList = () => <div>活动列表页面</div>
const CreateCampaign = () => <div>创建活动页面</div>
const CampaignApproval = () => <div>活动审批页面</div>
import TaskList from './pages/Task/List.jsx'
import CreatePushTask from './pages/Task/Create/index.jsx'
import ContentTemplateList from './pages/ContentTemplate/List.jsx'
import ContentTemplateEdit from './pages/ContentTemplate/Edit.jsx'
import PushDetail from './pages/Task/PushDetail.jsx'
const ContentManagement = () => <div>内容管理页面</div>
const TriggerRules = () => <div>触发规则页面</div>
const FlowCanvas = () => <div>流程画布页面</div>
import DashboardPage from './pages/Dashboard/index.jsx'
const AnalyticsDashboard = () => <div>营销大盘页面</div>
const Reports = () => <div>数据报告页面</div>
const SmartContent = () => <div>智能内容页面</div>
const SmartAudience = () => <div>智能人群页面</div>
import SystemConfig from './pages/System/Config.jsx'

// 路由配置
const router = createBrowserRouter([
  {
    path: '/tasks/create',
    element: <CreatePushTask />,
  },
  {
    path: '/content-templates/create',
    element: <ContentTemplateEdit />,
  },
  {
    path: '/content-templates/:id/edit',
    element: <ContentTemplateEdit />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      { path: '', element: <DashboardPage /> },
      // 项目空间模块
      { path: 'projects/list', element: <ProjectList /> },
      // App接入模块
      { path: 'apps/list', element: <AppList /> },
      // 用户画像模块
      { path: 'profile/players', element: <PlayerManagement /> },
      { path: 'profile/tags', element: <TagList /> },
      { path: 'profile/segments', element: <SegmentManagement /> },
      // 营销活动模块
      { path: 'campaigns/list', element: <CampaignList /> },
      { path: 'campaigns/create', element: <CreateCampaign /> },
      { path: 'campaigns/approval', element: <PushDetail /> },
      { path: 'tasks/list', element: <TaskList /> },
      // 渠道管理模块
      { path: 'channels/config', element: <ContentTemplateList /> },
      { path: 'channels/content', element: <ContentManagement /> },
      { path: 'channels/url', element: <div>URL管理页面</div> },
      { path: 'channels/image', element: <div>图片素材页面</div> },
      { path: 'channels/audio', element: <div>音频管理页面</div> },


      // 数据监控模块
      { path: 'analytics/dashboard', element: <AnalyticsDashboard /> },
      { path: 'analytics/reports', element: <Reports /> },

      // 系统管理模块
      { path: 'system/config', element: <SystemConfig /> },
      { path: 'system/approval', element: <div>审批管理页面</div> },
      { path: 'system/alerts', element: <div>告警中心页面</div> },
    ],
  },
])

export default router
