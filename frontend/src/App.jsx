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
  FireOutlined
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

const { Header, Content, Sider } = Layout

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      console.log('开始获取项目列表...')
      try {
        // 使用相对路径，利用 Vite 代理解决跨域问题
        const response = await axios.get('/api/v1/projects')
        console.log('获取项目列表成功:', response)
        console.log('项目数据:', response.data)
        console.log('项目数组:', response.data.projects)
        if (response.data && response.data.projects) {
          setProjects(response.data.projects)
          console.log('更新后的projects:', response.data.projects)
          if (response.data.projects.length > 0) {
            setCurrentProject(response.data.projects[0])
            console.log('设置当前项目:', response.data.projects[0])
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
        console.error('错误详情:', error.response?.data || error.message)
        console.error('错误堆栈:', error.stack)
      }
    }
    fetchProjects()
  }, [])

  // 切换项目
  const handleProjectChange = (value) => {
    const project = projects.find(p => p.project_id === value)
    setCurrentProject(project)
    // 可以在这里添加项目切换的逻辑，比如更新全局状态等
  }
  
  const { 
    token: { colorBgContainer, borderRadiusLG }, 
  } = theme.useToken()

  // 导航菜单配置
  const menuItems = [
    {
      key: '/projects',
      icon: <DatabaseOutlined />,
      label: '项目空间',
      children: [
        { key: '/projects/list', label: '项目管理' },
      ],
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '用户画像',
      children: [
        { key: '/profile/players', label: '玩家管理' },
        { key: '/profile/tags', label: '标签管理' },
        { key: '/profile/segments', label: '分群管理' },
      ],
    },
    {
      key: '/campaigns',
      icon: <CalendarOutlined />,
      label: '营销活动',
      children: [
        { key: '/campaigns/list', label: '活动列表' },
        { key: '/campaigns/create', label: '创建活动' },
        { key: '/campaigns/approval', label: '活动审批' },
      ],
    },
    {
      key: '/channels',
      icon: <MailOutlined />,
      label: '渠道管理',
      children: [
        { key: '/channels/config', label: '渠道配置' },
        { key: '/channels/content', label: '内容管理' },
      ],
    },
    {
      key: '/automation',
      icon: <FireOutlined />,
      label: '自动化引擎',
      children: [
        { key: '/automation/rules', label: '触发规则' },
        { key: '/automation/flows', label: '流程画布' },
      ],
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
      key: '/smart',
      icon: <DatabaseOutlined />,
      label: '智能营销',
      children: [
        { key: '/smart/content', label: '智能内容' },
        { key: '/smart/audience', label: '智能人群' },
      ],
    },
    {
      key: '/system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: '/system/users', label: '用户管理' },
        { key: '/system/roles', label: '角色权限' },
        { key: '/system/apps', label: 'App接入' },
        { key: '/system/config', label: '系统配置' },
      ],
    },
  ]

  // 处理菜单点击
  const handleMenuClick = (e) => {
    navigate(e.key)
  }

  return (
    <ConfigProvider locale={zhCN}>
      <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={setCollapsed}
            trigger={null}
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
                padding: 0, 
                background: colorBgContainer, 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 24px',
                borderBottom: '1px solid #f0f0f0'
              }} 
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className="trigger"
                  style={{ marginRight: 16, cursor: 'pointer', fontSize: 18 }}
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Space style={{ marginRight: 20 }}>
                  <DatabaseOutlined style={{ fontSize: 16, marginRight: 8 }} />
                  <Select
                    style={{ width: 200 }}
                    placeholder="选择项目空间"
                    value={currentProject?.project_id}
                    onChange={handleProjectChange}
                    options={projects.map(project => ({
                      value: project.project_id,
                      label: project.project_name
                    }))}
                    // 添加调试信息
                    onDropdownVisibleChange={(visible) => {
                      console.log('下拉列表可见:', visible)
                      console.log('当前项目列表:', projects)
                    }}
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
