import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Tag, Tooltip, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select

const ContentTemplateList = () => {
  const navigate = useNavigate()
  const { currentProject } = useCurrentProject()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // 筛选条件
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState(undefined)
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [creatorFilter, setCreatorFilter] = useState(undefined)

  // 获取列表
  const fetchList = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      const params = {
        project_id: currentProject.project_id,
        page: currentPage,
        page_size: pageSize,
      }
      if (searchText) params.keyword = searchText
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      if (creatorFilter) params.creator = creatorFilter
      const res = await axios.get('/api/v1/content-templates', { params })
      setList(res.data?.templates || [])
      setTotal(res.data?.total || 0)
    } catch (error) {
      message.error('获取内容模板列表失败')
      console.error('Failed to fetch content templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [currentProject, currentPage, pageSize])

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1)
    fetchList()
  }

  // 复制
  const handleCopy = async (record) => {
    try {
      await axios.post(`/api/v1/content-templates/${record.template_group_id}/copy`)
      message.success('复制成功')
      fetchList()
    } catch {
      message.error('复制失败')
    }
  }

  // 删除
  const handleDelete = async (record) => {
    try {
      await axios.delete(`/api/v1/content-templates/${record.template_group_id}`)
      message.success('删除成功')
      fetchList()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '文案组ID',
      dataIndex: 'template_group_id',
      key: 'template_group_id',
      width: 90,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '标题（第一条）',
      dataIndex: 'first_title',
      key: 'first_title',
      width: 130,
      ellipsis: true,
    },
    {
      title: '内容（第一条）',
      dataIndex: 'first_content',
      key: 'first_content',
      width: 130,
      ellipsis: true,
    },
    {
      title: '文案数量',
      dataIndex: 'copy_count',
      key: 'copy_count',
      width: 80,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 80,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 130,
      render: (t) => t ? new Date(t).toLocaleString() : '-',
    },
    {
      title: '修改人',
      dataIndex: 'updater',
      key: 'updater',
      width: 80,
    },
    {
      title: '修改时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 130,
      render: (t) => t ? new Date(t).toLocaleString() : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (status) => {
        const map = {
          'active': { color: 'green', label: '启用' },
          'inactive': { color: 'default', label: '停用' },
        }
        const cfg = map[status] || { color: 'default', label: status || '-' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '关联任务',
      dataIndex: 'related_tasks',
      key: 'related_tasks',
      width: 80,
      render: (tasks, record) => {
        const count = record.related_task_count || (tasks && tasks.length) || 0
        if (!count) return '-'
        const content = (tasks || []).map((t) => t.task_name || t).join('\n')
        return (
          <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{content}</span>}>
            <a>{count}</a>
          </Tooltip>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => navigate(`/content-templates/${record.template_group_id}/edit`)}>
            编辑
          </Button>
          <Button type="link" icon={<CopyOutlined />} size="small" onClick={() => handleCopy(record)}>
            复制
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>内容模板</h2>

      {/* 筛选区域 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ marginBottom: 4, fontSize: 13 }}>ID/名称</div>
          <Input
            placeholder="请输入ID/名称搜索"
            style={{ width: 180 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
          />
        </div>
        <div>
          <div style={{ marginBottom: 4, fontSize: 13 }}>类型</div>
          <Select
            style={{ width: 130 }}
            placeholder="全部"
            allowClear
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v); setCurrentPage(1) }}
          >
            <Option value="push">推送</Option>
            <Option value="sms">短信</Option>
            <Option value="email">邮件</Option>
          </Select>
        </div>
        <div>
          <div style={{ marginBottom: 4, fontSize: 13 }}>状态</div>
          <Select
            style={{ width: 130 }}
            placeholder="全部"
            allowClear
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}
          >
            <Option value="active">启用</Option>
            <Option value="inactive">停用</Option>
          </Select>
        </div>
        <div>
          <div style={{ marginBottom: 4, fontSize: 13 }}>创建人</div>
          <Select
            style={{ width: 130 }}
            placeholder="全部"
            allowClear
            value={creatorFilter}
            onChange={(v) => { setCreatorFilter(v); setCurrentPage(1) }}
          >
            {/* 动态选项可后续从接口获取 */}
          </Select>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content-templates/create')}>
            创建文案
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={list}
        rowKey="template_group_id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size) },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
      />
    </div>
  )
}

export default ContentTemplateList
