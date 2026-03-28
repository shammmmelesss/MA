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
import CampaignList from './pages/Campaign/List.jsx'
import CreateCampaign from './pages/Campaign/Create.jsx'
import CampaignApproval from './pages/Campaign/Approval.jsx'
const ChannelConfig = () => <div>渠道配置页面</div>
const ContentManagement = () => <div>内容管理页面</div>
const TriggerRules = () => <div>触发规则页面</div>
const FlowCanvas = () => <div>流程画布页面</div>
const Dashboard = () => <div>营销大盘页面</div>
const Reports = () => <div>数据报告页面</div>
const SmartContent = () => <div>智能内容页面</div>
const SmartAudience = () => <div>智能人群页面</div>
const UserManagement = () => <div>用户管理页面</div>
const RoleManagement = () => <div>角色权限页面</div>
const AppAccess = () => <div>App接入页面</div>
const SystemConfig = () => <div>系统配置页面</div>

// 路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '', element: <Home /> },
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
      { path: 'campaigns/approval/:id', element: <CampaignApproval /> },
      // 渠道管理模块
      { path: 'channels/config', element: <ChannelConfig /> },
      { path: 'channels/content', element: <ContentManagement /> },
      // 自动化引擎模块
      { path: 'automation/rules', element: <TriggerRules /> },
      { path: 'automation/flows', element: <FlowCanvas /> },
      // 数据监控模块
      { path: 'analytics/dashboard', element: <Dashboard /> },
      { path: 'analytics/reports', element: <Reports /> },
      // 智能营销模块
      { path: 'smart/content', element: <SmartContent /> },
      { path: 'smart/audience', element: <SmartAudience /> },
      // 系统管理模块
      { path: 'system/users', element: <UserManagement /> },
      { path: 'system/roles', element: <RoleManagement /> },
      { path: 'system/apps', element: <AppList /> },
      { path: 'system/config', element: <SystemConfig /> },
    ],
  },
])

export default router
