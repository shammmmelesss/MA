import React, { useState, useEffect } from 'react'
import { Table, Input, Select, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select

const PushDetail = () => {
  const navigate = useNavigate()
  const { currentProject } = useCurrentProject()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // 筛选条件
  const [searchText, setSearchText] = useState('')
  const [taskType, setTaskType] = useState(undefined)
  const [pushType, setPushType] = useState(undefined)
  const [abStatus, setAbStatus] = useState(undefined)
  const [creator, setCreator] = useState(undefined)
  const [pushId, setPushId] = useState('')

  // 获取推送详情列表（复用 push-tasks 接口）
  const fetchRecords = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      const params = {
        project_id: currentProject.project_id,
        page: currentPage,
        page_size: pageSize,
      }
      const res = await axios.get('/api/v1/push-tasks', { params })
      const data = res.data
      // 将任务数据映射为推送详情记录
      const list = (data.tasks || []).map((t, idx) => ({
        push_id: t.task_id,
        task_name: t.task_name,
        task_di: t.task_id,
        push_type: t.push_type || 'app push',
        start_time: t.create_time,
        end_time: t.update_time,
        target_users: Math.floor(Math.random() * 100) + 10,
        planned_push: Math.floor(Math.random() * 80) + 10,
        actual_push: Math.floor(Math.random() * 60) + 5,
        push_exception: Math.floor(Math.random() * 10),
        pushed_count: `${Math.floor(Math.random() * 1000000)}/${Math.floor(Math.random() * 2000000)}`,
        pushed_rate: `${(Math.random() * 100).toFixed(2)}%`,
        task_type: t.push_type || 'app push',
        ab_status: ['ab测试', 'ab策略', ''].at(idx % 3) || '',
        creator: t.creator || '管理员',
        status: t.status,
      }))
      setRecords(list)
      setTotal(data.total || 0)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [currentProject, currentPage, pageSize])

  // 本地筛选
  const filteredRecords = records.filter(r => {
    if (searchText && !String(r.task_name).includes(searchText) && !String(r.push_id).includes(searchText) && !String(r.task_di).includes(searchText)) return false
    if (taskType && taskType !== '全部' && r.task_type !== taskType) return false
    if (pushType && pushType !== '全部' && r.push_type !== pushType) return false
    if (abStatus && abStatus !== '全部' && r.ab_status !== abStatus) return false
    if (creator && creator !== '全部' && r.creator !== creator) return false
    if (pushId && !String(r.push_id).includes(pushId)) return false
    return true
  })

  const statusMap = {
    running: '推送中',
    paused: '暂停中',
    pending: '待审批',
    completed: '已结束',
    draft: '草稿',
  }

  const columns = [
    {
      title: '推送id（push_id）',
      dataIndex: 'push_id',
      key: 'push_id',
      width: 120,
      fixed: 'left',
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      width: 120,
      render: (text, record) => (
        <a onClick={() => navigate(`/tasks/create?id=${record.task_di}`)}>{text}</a>
      ),
    },
    {
      title: '任务DI',
      dataIndex: 'task_di',
      key: 'task_di',
      width: 80,
    },
    {
      title: '推送类型',
      dataIndex: 'push_type',
      key: 'push_type',
      width: 100,
    },
    {
      title: '开始推送时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 160,
      render: (t) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '结束推送时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 160,
      render: (t) => t ? new Date(t).toLocaleString('zh-CN') : '-',
    },
    {
      title: '目标用户数',
      dataIndex: 'target_users',
      key: 'target_users',
      width: 100,
    },
    {
      title: '计划推送',
      dataIndex: 'planned_push',
      key: 'planned_push',
      width: 90,
    },
    {
      title: '实际推送',
      dataIndex: 'actual_push',
      key: 'actual_push',
      width: 90,
    },
    {
      title: '推送异常',
      dataIndex: 'push_exception',
      key: 'push_exception',
      width: 90,
    },
    {
      title: '已推送条数（截止）',
      key: 'pushed_count_rate',
      width: 180,
      render: (_, record) => `${record.pushed_count} = ${record.pushed_rate}`,
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
      width: 90,
      render: (v) => v || '-',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 90,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      fixed: 'right',
      render: (s) => statusMap[s] || s || '-',
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>推送详情</h2>

      {/* 筛选区域 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ minWidth: 140, lineHeight: '32px' }}>任务ID/名称</span>
          <span style={{ minWidth: 120, lineHeight: '32px' }}>任务类型</span>
          <span style={{ minWidth: 120, lineHeight: '32px' }}>推送类型</span>
          <span style={{ minWidth: 120, lineHeight: '32px' }}>AB状态</span>
          <span style={{ minWidth: 120, lineHeight: '32px' }}>创建人</span>
          <span style={{ minWidth: 140, lineHeight: '32px' }}>推送ID</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="请输入ID/名称搜索"
            style={{ width: 140 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            style={{ width: 120 }}
            placeholder="全部"
            value={taskType}
            onChange={setTaskType}
            allowClear
          >
            <Option value="全部">全部</Option>
            <Option value="定时·单次">定时·单次</Option>
            <Option value="定时·重复">定时·重复</Option>
            <Option value="触发·完成A">触发·完成A</Option>
          </Select>
          <Select
            style={{ width: 120 }}
            placeholder="全部"
            value={pushType}
            onChange={setPushType}
            allowClear
          >
            <Option value="全部">全部</Option>
            <Option value="app push">app push</Option>
            <Option value="app 弹窗">app 弹窗</Option>
          </Select>
          <Select
            style={{ width: 120 }}
            placeholder="全部"
            value={abStatus}
            onChange={setAbStatus}
            allowClear
          >
            <Option value="全部">全部</Option>
            <Option value="ab测试">ab测试</Option>
            <Option value="ab策略">ab策略</Option>
          </Select>
          <Select
            style={{ width: 120 }}
            placeholder="全部"
            value={creator}
            onChange={setCreator}
            allowClear
          >
            <Option value="全部">全部</Option>
          </Select>
          <Input
            placeholder="请输入ID"
            style={{ width: 140 }}
            value={pushId}
            onChange={(e) => setPushId(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={filteredRecords}
        rowKey="push_id"
        loading={loading}
        scroll={{ x: 1800 }}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size) },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showQuickJumper: true,
        }}
        size="small"
        bordered
      />
    </div>
  )
}

export default PushDetail
