import React, { useState, useEffect, createContext, useContext } from 'react'
import { Layout, Menu, theme, Select, Space } from 'antd'
import {
  UserOutlined, 
  TagOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  PieChartOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  UserSwitchOutlined,
  DatabaseOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MailOutlined,
  FireOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import axios from 'axios'

// 创建项目上下文
export const ProjectContext = createContext()

// 自定义钩子，用于在子组件中获取当前项目
export const useCurrentProject = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useCurrentProject must be used within a ProjectProvider')
  }
  return context
}

// 自定义钩子，用于获取项目列表及刷新方法
export const useProjects = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}

const { Header, Content, Sider } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/v1/projects')
      if (response.data && response.data.projects) {
        const newProjects = response.data.projects
        setProjects(newProjects)
        
        // 优先使用 localStorage 保存的项目ID，其次保持当前选中的项目
        const savedId = localStorage.getItem('currentProjectId')
        const currentId = savedId || (currentProject ? String(currentProject.project_id) : null)
        const matched = currentId ? newProjects.find(p => String(p.project_id) === currentId) : null
        setCurrentProject(matched || newProjects[0] || null)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // 切换项目
  const handleProjectChange = (value) => {
    const project = projects.find(p => p.project_id === value)
    setCurrentProject(project)
    localStorage.setItem('currentProjectId', String(value))
  }
  
  const { 
    token: { colorBgContainer, borderRadiusLG }, 
  } = theme.useToken()

  // 导航菜单配置
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据监控',
      children: [
        { key: '/analytics/dashboard', label: '营销大盘' },
        { key: '/analytics/reports', label: '数据报告' },
      ],
    },
    {
      key: '/campaigns',
      icon: <CalendarOutlined />,
      label: '营销活动',
      children: [
        { key: '/tasks/list', label: '任务列表' },
        { key: '/campaigns/create', label: '运营画布' },
        { key: '/campaigns/approval', label: '推送详情' },
      ],
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '用户画像',
      children: [
        { key: '/profile/players', label: '用户管理' },
        { key: '/profile/attributes', label: '用户属性' },
        { key: '/profile/events', label: '事件管理' },
        { key: '/profile/tags', label: '标签管理' },
        { key: '/profile/segments', label: '分群管理' },
      ],
    },
    
    {
      key: '/channels',
      icon: <MailOutlined />,
      label: '素材管理',
      children: [
        { key: '/channels/config', label: '内容模板' },
        { key: '/channels/content', label: '视频管理' },
        { key: '/channels/url', label: 'URL管理' },
        { key: '/channels/image', label: '图片素材' },
        { key: '/channels/audio', label: '音频管理' },
      ],
    },
   
    

    {
      key: '/system',
      icon: <SettingOutlined />,
      label: '项目管理',
      children: [
        { key: '/system/config', label: '项目信息' },
        { key: '/system/approval', label: '审批管理' },
        { key: '/system/alerts', label: '告警中心' },
      ],
    },
  ]

  // 处理菜单点击
  const handleMenuClick = (e) => {
    navigate(e.key)
  }

  return (
    <ConfigProvider locale={zhCN}>
      <ProjectContext.Provider value={{ currentProject, setCurrentProject, projects, refreshProjects: fetchProjects }}>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={setCollapsed}
            style={{ 
              background: colorBgContainer,
            }}
          >
            <div style={{ 
            height: 32, 
            margin: 16, 
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: borderRadiusLG,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1890ff'
          }}>
            <img 
              src="https://img.icons8.com/color/48/000000/marketing.png" 
              alt="Logo" 
              style={{ height: 24, marginRight: collapsed ? 0 : 8 }} 
            />
            {!collapsed && '营销平台'}
          </div>
            <Menu 
              theme="light" 
              mode="inline" 
              selectedKeys={[location.pathname]} 
              items={menuItems}
              onClick={handleMenuClick}
            />
          </Sider>
          <Layout>
            <Header 
              style={{ 
                background: colorBgContainer, 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 24px',
                borderBottom: '1px solid #f0f0f0'
              }} 
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>

              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div 
                  style={{ 
                    marginRight: 20, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => navigate('/projects/list')}
                >
                  <DatabaseOutlined style={{ fontSize: 18, marginRight: 8 }} />
                  <span>系统管理</span>
                </div>
                <Space style={{ marginRight: 20 }}>
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择项目空间"
                    value={currentProject?.project_id}
                    onChange={handleProjectChange}
                    options={projects.map(project => ({
                      value: project.project_id,
                      label: project.project_name
                    }))}
                  />
                </Space>
                <UserOutlined style={{ fontSize: 20 }} />
                <span style={{ marginLeft: 8 }}>管理员</span>
              </div>
            </Header>
            <Content style={{ 
              margin: '24px 16px', 
              padding: 24, 
              minHeight: 280, 
              background: colorBgContainer, 
              borderRadius: borderRadiusLG, 
            }}>
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </ProjectContext.Provider>
    </ConfigProvider>
  )
}

export default App
