import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Tag, Space, message, Drawer } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select

const TaskList = () => {
  const navigate = useNavigate()
  const { currentProject } = useCurrentProject()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [taskType, setTaskType] = useState('全部')
  const [pushType, setPushType] = useState('全部')
  const [abStatus, setAbStatus] = useState('全部')
  const [creator, setCreator] = useState('全部')
  const [activeTab, setActiveTab] = useState('全部')

  // 草稿抽屉
  const [draftDrawerOpen, setDraftDrawerOpen] = useState(false)
  const [draftTasks, setDraftTasks] = useState([])
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftSearchText, setDraftSearchText] = useState('')
  const [draftCreator, setDraftCreator] = useState('全部')
  const [draftStatus, setDraftStatus] = useState('全部')

  const statusTabs = [
    { key: '全部', label: '全部', count: 190 },
    { key: '已发布', label: '已发布', count: 60 },
    { key: '已结束', label: '已结束', count: 40 },
  ]

  const fetchTasks = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      const params = {
        project_id: currentProject.project_id,
        page: currentPage,
        page_size: pageSize,
      }
      if (activeTab !== '全部') {
        const statusMap = { '已发布': 'published', '已结束': 'completed' }
        params.status = statusMap[activeTab] || activeTab
      }
      const res = await axios.get('/api/v1/push-tasks', { params })
      const data = res.data
      setTasks(data.tasks || [])
      setTotal(data.total || 0)
    } catch (error) {
      message.error('获取任务列表失败')
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDraftTasks = async () => {
    if (!currentProject) return
    setDraftLoading(true)
    try {
      const params = {
        project_id: currentProject.project_id,
        status: 'draft',
      }
      if (draftStatus !== '全部') params.draft_status = draftStatus
      const res = await axios.get('/api/v1/push-tasks', { params })
      const data = res.data
      setDraftTasks(data.tasks || [])
    } catch (error) {
      message.error('获取草稿列表失败')
      console.error('Failed to fetch draft tasks:', error)
    } finally {
      setDraftLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [currentProject, currentPage, pageSize, activeTab, taskType, pushType, abStatus, creator, searchText])

  useEffect(() => {
    if (draftDrawerOpen) fetchDraftTasks()
  }, [draftDrawerOpen, draftSearchText, draftCreator, draftStatus, currentProject])

  const columns = [
    {
      title: '任务DI',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 80,
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 120,
    },
    {
      title: '推送类型',
      dataIndex: 'push_type',
      key: 'push_type',
      width: 100,
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
    },
    {
      title: 'AB状态',
      dataIndex: 'ab_status',
      key: 'ab_status',
      width: 100,
      render: (val) => val || '非AB实验',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 160,
      sorter: true,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : '-',
    },
    {
      title: '修改人',
      dataIndex: 'update_user',
      key: 'update_user',
      width: 100,
      render: (val) => val || '-',
    },
    {
      title: '修改时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 160,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : '-',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 180,
      render: (content) => (
        <div style={{ fontSize: 12, color: '#333', maxWidth: 180, wordBreak: 'break-all' }}>
          {content || '-'}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status, record) => {
        const statusConfig = {
          'published': { color: 'blue', label: '已发布' },
          'completed': { color: 'default', label: '已结束' },
          'draft': { color: 'purple', label: '草稿' },
          'running': { color: 'green', label: '运行中' },
          'paused': { color: 'orange', label: '暂停中' },
          'pending': { color: 'gold', label: '待审批' },
        }
        const cfg = statusConfig[status] || { color: 'default', label: status }
        return (
          <div>
            <Tag color={cfg.color}>{cfg.label}</Tag>
            {record.sub_status && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                ({record.sub_status})
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => {
        const isEnded = record.status === 'completed'
        return (
          <Space size={0}>
            {!isEnded && (
              <Button type="link" size="small" onClick={() => navigate(`/tasks/edit/${record.task_id}`)}>
                编辑
              </Button>
            )}
            <Button type="link" size="small">复制</Button>
            {!isEnded && (
              <Button type="link" size="small" danger>关闭</Button>
            )}
            <Button type="link" size="small">推送详情</Button>
          </Space>
        )
      },
    },
  ]

  // 草稿抽屉的状态配置
  const draftStatusConfig = {
    'draft': { label: '草稿' },
    'pending': { label: '待审批' },
    'rejected': { label: '被驳回' },
  }

  const draftColumns = [
    { title: '任务DI', dataIndex: 'task_id', key: 'task_id', width: 70 },
    { title: '任务名称', dataIndex: 'task_name', key: 'task_name', width: 100 },
    { title: '推送类型', dataIndex: 'push_type', key: 'push_type', width: 100 },
    { title: '任务类型', dataIndex: 'task_type', key: 'task_type', width: 100 },
    { title: 'AB状态', dataIndex: 'ab_status', key: 'ab_status', width: 90, render: (val) => val || '非AB实验' },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 90, render: (val) => val || '-' },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 140,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : '-',
    },
    { title: '修改人', dataIndex: 'update_user', key: 'update_user', width: 90, render: (val) => val || '-' },
    {
      title: '修改时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 140,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN', { hour12: false }) : '-',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 160,
      render: (content) => (
        <div style={{ fontSize: 12, color: '#333', maxWidth: 160, wordBreak: 'break-all' }}>
          {content || '-'}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => {
        const cfg = draftStatusConfig[status] || { label: status || '草稿' }
        return <span>{cfg.label}</span>
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, record) => {
        const isPending = record.status === 'pending'
        return (
          <Space size={0}>
            {isPending ? (
              <Button type="link" size="small" danger>取消审批</Button>
            ) : (
              <>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/tasks/edit/${record.task_id}`)}
                >
                  编辑
                </Button>
                <Button type="link" size="small" danger>删除</Button>
              </>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      {/* 顶部标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>任务列表</h2>
        <Space>
          <Button onClick={() => setDraftDrawerOpen(true)}>草稿 (3)</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/create')}>
            新建任务
          </Button>
        </Space>
      </div>

      {/* 状态标签 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        {statusTabs.map(tab => (
          <Button
            key={tab.key}
            type={activeTab === tab.key ? 'primary' : 'default'}
            onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {/* 搜索和筛选 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          <span style={{ fontSize: 13, color: '#333' }}>任务ID/名称</span>
          <Input
            placeholder="请输入ID/名称搜索"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
          <span style={{ fontSize: 13, color: '#333' }}>任务类型</span>
          <Select value={taskType} onChange={setTaskType} style={{ width: '100%' }}>
            <Option value="全部">全部</Option>
            <Option value="app push">app push</Option>
            <Option value="app 弹窗">app 弹窗</Option>
          </Select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
          <span style={{ fontSize: 13, color: '#333' }}>推送类型</span>
          <Select value={pushType} onChange={setPushType} style={{ width: '100%' }}>
            <Option value="全部">全部</Option>
            <Option value="定时-单次">定时-单次</Option>
            <Option value="定时-重复">定时-重复</Option>
          </Select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
          <span style={{ fontSize: 13, color: '#333' }}>AB状态</span>
          <Select value={abStatus} onChange={setAbStatus} style={{ width: '100%' }}>
            <Option value="全部">全部</Option>
            <Option value="AB实验">AB实验</Option>
            <Option value="非AB实验">非AB实验</Option>
          </Select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
          <span style={{ fontSize: 13, color: '#333' }}>创建人</span>
          <Select value={creator} onChange={setCreator} style={{ width: '100%' }}>
            <Option value="全部">全部</Option>
          </Select>
        </div>
      </div>

      {/* 任务表格 */}
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="task_id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size) },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        scroll={{ x: 'max-content' }}
      />

      {/* 草稿抽屉 */}
      <Drawer
        title="草稿"
        placement="right"
        width="80%"
        open={draftDrawerOpen}
        onClose={() => setDraftDrawerOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => setDraftDrawerOpen(false)}>关闭</Button>
          </div>
        }
      >
        {/* 草稿筛选 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
            <span style={{ fontSize: 13, color: '#333' }}>任务ID/名称</span>
            <Input
              placeholder="请输入ID/名称搜索"
              value={draftSearchText}
              onChange={(e) => setDraftSearchText(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 13, color: '#333' }}>创建人</span>
            <Select value={draftCreator} onChange={setDraftCreator} style={{ width: '100%' }}>
              <Option value="全部">全部</Option>
            </Select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <span style={{ fontSize: 13, color: '#333' }}>状态</span>
            <Select value={draftStatus} onChange={setDraftStatus} style={{ width: '100%' }}>
              <Option value="全部">全部</Option>
              <Option value="draft">草稿</Option>
              <Option value="pending">待审批</Option>
              <Option value="rejected">被驳回</Option>
            </Select>
          </div>
        </div>

        {/* 草稿表格 */}
        <Table
          columns={draftColumns}
          dataSource={draftTasks}
          rowKey="task_id"
          loading={draftLoading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Drawer>
    </div>
  )
}

export default TaskList
