import React, { useState, useEffect } from 'react'
import {
  Row, Col, Card, Statistic, Table, Tag, Avatar, Typography, Space, Progress, List, Timeline, Spin,
} from 'antd'
import {
  UserOutlined, RocketOutlined, CheckCircleOutlined, ClockCircleOutlined,
  FileTextOutlined, PauseCircleOutlined, EditOutlined, BellOutlined,
  ProjectOutlined, AppstoreOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useCurrentProject } from '../../App.jsx'

const { Title, Text } = Typography

const DashboardPage = () => {
  const navigate = useNavigate()
  const { currentProject, projects } = useCurrentProject()
  const [tasks, setTasks] = useState([])
  const [taskTotal, setTaskTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // 获取当前项目的任务列表
  useEffect(() => {
    if (!currentProject) return
    setLoading(true)
    axios
      .get('/api/v1/push-tasks', {
        params: { project_id: currentProject.project_id, page: 1, page_size: 100 },
      })
      .then((res) => {
        setTasks(res.data.tasks || [])
        setTaskTotal(res.data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentProject])

  // 按状态统计
  const statusCount = (status) => tasks.filter((t) => t.status === status).length
  const runningCount = statusCount('running')
  const draftCount = statusCount('draft')
  const completedCount = statusCount('completed')
  const pendingCount = statusCount('pending')
  const pausedCount = statusCount('paused')

  // 最近更新的任务（取前5条）
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.update_time) - new Date(a.update_time))
    .slice(0, 5)

  const statusConfig = {
    running: { color: 'green', label: '运行中' },
    paused: { color: 'orange', label: '暂停中' },
    pending: { color: 'blue', label: '待审批' },
    completed: { color: 'default', label: '已结束' },
    draft: { color: 'purple', label: '草稿' },
  }

  const recentColumns = [
    { title: '任务名称', dataIndex: 'task_name', key: 'task_name', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => {
        const cfg = statusConfig[s] || { color: 'default', label: s }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 170,
      render: (t) => (t ? new Date(t).toLocaleString() : '-'),
    },
  ]

  // 快捷入口
  const shortcuts = [
    { title: '创建任务', icon: <RocketOutlined style={{ fontSize: 24, color: '#1890ff' }} />, path: '/tasks/create' },
    { title: '任务列表', icon: <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />, path: '/tasks/list' },
    { title: '内容模板', icon: <EditOutlined style={{ fontSize: 24, color: '#faad14' }} />, path: '/channels/config' },
    { title: '标签管理', icon: <AppstoreOutlined style={{ fontSize: 24, color: '#722ed1' }} />, path: '/profile/tags' },
    { title: '项目管理', icon: <ProjectOutlined style={{ fontSize: 24, color: '#13c2c2' }} />, path: '/system/config' },
  ]

  // 模拟操作日志
  const activityLogs = [
    { time: '10 分钟前', content: '管理员 创建了推送任务「春节活动召回」' },
    { time: '30 分钟前', content: '管理员 编辑了内容模板「新版本更新通知」' },
    { time: '1 小时前', content: '管理员 审批通过了任务「日常签到提醒」' },
    { time: '2 小时前', content: '系统 自动完成了任务「周末活动推送」' },
    { time: '3 小时前', content: '管理员 创建了新标签「高价值用户」' },
  ]

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 4 }}>
          👋 欢迎回来，管理员
        </Title>
        <Text type="secondary">
          当前项目：{currentProject?.project_name || '未选择'} · 共 {projects.length} 个项目空间
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/tasks/list')}>
            <Statistic title="任务总数" value={taskTotal} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic title="运行中" value={runningCount} prefix={<RocketOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic title="待审批" value={pendingCount} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic title="已结束" value={completedCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#999' }} />
          </Card>
        </Col>
      </Row>

      {/* 任务状态分布 + 快捷入口 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="任务状态分布">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {[
                { label: '运行中', count: runningCount, color: '#52c41a' },
                { label: '暂停中', count: pausedCount, color: '#faad14' },
                { label: '待审批', count: pendingCount, color: '#1890ff' },
                { label: '草稿', count: draftCount, color: '#722ed1' },
                { label: '已结束', count: completedCount, color: '#d9d9d9' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text style={{ width: 60 }}>{item.label}</Text>
                  <Progress
                    percent={taskTotal ? Math.round((item.count / taskTotal) * 100) : 0}
                    strokeColor={item.color}
                    format={() => item.count}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="快捷入口">
            <Row gutter={[16, 16]}>
              {shortcuts.map((s) => (
                <Col span={8} key={s.title}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center' }}
                    bodyStyle={{ padding: 16 }}
                    onClick={() => navigate(s.path)}
                  >
                    {s.icon}
                    <div style={{ marginTop: 8, fontSize: 13 }}>{s.title}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近任务 + 操作日志 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="最近更新的任务" extra={<a onClick={() => navigate('/tasks/list')}>查看全部</a>}>
            <Table
              columns={recentColumns}
              dataSource={recentTasks}
              rowKey="task_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="操作动态" extra={<BellOutlined />}>
            <Timeline
              items={activityLogs.map((log) => ({
                children: (
                  <>
                    <Text>{log.content}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{log.time}</Text>
                  </>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* 用户信息卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="个人信息">
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <Title level={5} style={{ margin: 0 }}>管理员</Title>
              <Text type="secondary">admin@example.com</Text>
              <Tag color="blue">超级管理员</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="项目概览">
            <List
              dataSource={projects.slice(0, 4)}
              renderItem={(p) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{p.project_name?.[0]}</Avatar>}
                    title={p.project_name}
                    description={p.description || '暂无描述'}
                  />
                  <Tag color={p.status === 1 ? 'green' : 'default'}>{p.status === 1 ? '正常' : '禁用'}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}

export default DashboardPage
