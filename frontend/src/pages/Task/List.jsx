import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Tag, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, CopyOutlined, CloseOutlined } from '@ant-design/icons'
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
  const [pushTime, setPushTime] = useState('全部')
  const [abStatus, setAbStatus] = useState('全部')
  const [activeTab, setActiveTab] = useState('全部')

  // 状态标签数据
  const statusTabs = [
    { key: '全部', label: '全部', count: 190 },
    { key: '运行中', label: '运行中', count: 60 },
    { key: '暂停中', label: '暂停中', count: 40 },
    { key: '待审批', label: '待审批', count: 3 },
    { key: '已结束', label: '已结束', count: 40 },
    { key: '草稿', label: '草稿', count: 1 }
  ]

  // 获取任务列表
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
        // 将中文状态映射为后端状态值
        const statusMap = {
          '运行中': 'running',
          '暂停中': 'paused',
          '待审批': 'pending',
          '已结束': 'completed',
          '草稿': 'draft',
        }
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

  // 组件挂载时获取任务列表，项目切换时重新获取
  useEffect(() => {
    fetchTasks()
  }, [currentProject, currentPage, pageSize, activeTab, taskType, pushTime, abStatus, searchText])

  // 表格列配置
  const columns = [
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
    },
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          'running': { color: 'green', label: '运行中' },
          'paused': { color: 'orange', label: '暂停中' },
          'pending': { color: 'blue', label: '待审批' },
          'completed': { color: 'gray', label: '已结束' },
          'draft': { color: 'purple', label: '草稿' },
        }
        const cfg = statusConfig[status] || { color: 'default', label: status }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      }
    },
    {
      title: '推送类型',
      dataIndex: 'push_type',
      key: 'push_type',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator) => creator || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (time) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
      render: (time) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<CopyOutlined />}
          >
            复制
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<CloseOutlined />}
          >
            关闭
          </Button>
        </Space>
      ),
    },
  ]

  // 处理分页变化
  const handlePaginationChange = (page, pageSize) => {
    setCurrentPage(page)
    setPageSize(pageSize)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>任务列表</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tasks/create')}>
          创建任务
        </Button>
      </div>

      {/* 状态标签 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {statusTabs.map(tab => (
          <Button
            key={tab.key}
            type={activeTab === tab.key ? 'primary' : 'default'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {/* 搜索和筛选 */}
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>任务ID/名称</div>
          <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>任务类型</div>
          <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>推送类型</div>
          <div style={{ flex: 1, minWidth: '120px', textAlign: 'left' }}>AB状态</div>
          <div style={{ flex: 2, minWidth: '240px' }}></div> {/* 占位，确保每个筛选器占1/6 */}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="请输入ID/名称搜索"
            style={{ flex: 1, minWidth: '120px' }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            style={{ flex: 1, minWidth: '120px' }}
            placeholder="全部"
            value={taskType}
            onChange={setTaskType}
          >
            <Option value="全部">全部</Option>
            <Option value="app push">app push</Option>
            <Option value="app 弹窗">app 弹窗</Option>
          </Select>
          <Select
            style={{ flex: 1, minWidth: '120px' }}
            placeholder="全部"
            value={pushTime}
            onChange={setPushTime}
          >
            <Option value="全部">全部</Option>
            <Option value="已推送就绪">已推送就绪</Option>
          </Select>
          <Select
            style={{ flex: 1, minWidth: '120px' }}
            placeholder="全部"
            value={abStatus}
            onChange={setAbStatus}
          >
            <Option value="全部">全部</Option>
            <Option value="开启">开启</Option>
            <Option value="未开启">未开启</Option>
          </Select>
          <div style={{ flex: 2, minWidth: '240px' }}></div> {/* 占位，确保每个筛选器占1/6 */}
        </div>
      </div>

      {/* 任务表格 */}
      <div style={{ maxHeight: '80vh', overflow: 'auto', width: '100%' }}>
        <Table
          columns={columns.map(column => {
            if (column.key === 'action') {
              return {
                ...column,
                fixed: 'right',
                width: 220
              };
            }
            return column;
          })}
          dataSource={tasks}
          rowKey="task_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: handlePaginationChange,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50']
          }}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  )
}

export default TaskList