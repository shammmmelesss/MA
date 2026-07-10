import React, { useState, useEffect } from 'react'
import {
  Table, Button, Input, Select, Space, message,
  Form, Tag, Popconfirm, Radio, TimePicker, Upload,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ArrowLeftOutlined, UploadOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select
const BASE = '/api/v1/subscriptions'

const statusMap = { 1: { text: '开启', color: 'green' }, 0: { text: '停用', color: 'default' } }
const typeMap = { sql: 'SQL', api: 'API', offline: '离线上传' }
const cycleOptions = [
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
]

const SubscriptionList = () => {
  const { currentProject } = useCurrentProject()

  // 列表状态
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10

  // 筛选
  const [filterName, setFilterName] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  // 视图：'list' | 'form'
  const [view, setView] = useState('list')
  const [editing, setEditing] = useState(null) // null = 新建

  const [form] = Form.useForm()
  const [subType, setSubType] = useState('sql')
  const [saving, setSaving] = useState(false)

  const fetchList = async () => {
    if (!currentProject?.project_id) return
    setLoading(true)
    try {
      const res = await axios.get(BASE, {
        params: {
          project_id: currentProject.project_id,
          name: filterName || undefined,
          status: filterStatus !== '' ? filterStatus : undefined,
          type: filterType || undefined,
          page,
          page_size: pageSize,
        },
      })
      setList(res.data.subscriptions || res.data.list || [])
      setTotal(res.data.total || 0)
    } catch {
      message.error('获取订阅列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [currentProject, page, filterName, filterStatus, filterType])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 1, type: 'sql', task_cycle: 'daily', sql_content: 'select * from table' })
    setSubType('sql')
    setView('form')
  }

  const openEdit = async (record) => {
    setEditing(record)
    try {
      const res = await axios.get(`${BASE}/${record.id}`)
      const data = res.data.subscription || res.data
      form.setFieldsValue({
        name: data.name,
        status: data.status,
        type: data.type,
        task_cycle: data.task_cycle,
        task_time: data.task_time ? dayjs(data.task_time, 'HH:mm') : null,
        sql_content: data.sql_content,
        api_url: data.api_url,
      })
      setSubType(data.type || 'sql')
    } catch {
      message.error('获取订阅详情失败')
    }
    setView('form')
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE}/${id}`)
      message.success('删除成功')
      fetchList()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSave = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    setSaving(true)
    try {
      const payload = {
        project_id: currentProject.project_id,
        name: values.name,
        status: values.status,
        type: values.type,
        task_cycle: values.task_cycle,
        task_time: values.task_time ? values.task_time.format('HH:mm') : '',
        sql_content: values.sql_content || '',
        api_url: values.api_url || '',
        created_by: '',
      }
      if (editing) {
        await axios.put(`${BASE}/${editing.id}`, payload)
        message.success('更新成功')
      } else {
        await axios.post(BASE, payload)
        message.success('创建成功')
      }
      setView('list')
      fetchList()
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
      render: (v) => typeMap[v] || v,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const s = statusMap[v] || { text: v, color: 'default' }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    { title: '创建人', dataIndex: 'created_by', key: 'created_by' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    { title: '修改人', dataIndex: 'updated_by', key: 'updated_by' },
    {
      title: '修改时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ---- 表单视图 ----
  if (view === 'form') {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => setView('list')}
              style={{ padding: 0 }}
            />
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {editing ? '编辑订阅' : '新建订阅'}
            </span>
          </Space>
          <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
        </div>

        <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入订阅名称" />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Radio.Group>
              <Radio value={1}>开启</Radio>
              <Radio value={0}>关闭</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="type" label="类型">
            <Radio.Group onChange={(e) => setSubType(e.target.value)}>
              <Radio value="sql">SQL</Radio>
              <Radio value="api">API</Radio>
              <Radio value="offline">离线上传</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="任务设置">
            <Space>
              <Form.Item name="task_cycle" noStyle>
                <Select style={{ width: 120 }}>
                  {cycleOptions.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="task_time" noStyle>
                <TimePicker format="HH:mm" placeholder="选择时间" />
              </Form.Item>
            </Space>
          </Form.Item>

          {subType === 'sql' && (
            <Form.Item
              name="sql_content"
              label={<Space><span>sql</span><span style={{ color: '#999', fontWeight: 400, fontSize: 12 }}>只能有luid和production_id两列数据</span></Space>}
            >
              <Input.TextArea rows={5} placeholder="select * from table" />
            </Form.Item>
          )}

          {subType === 'api' && (
            <Form.Item name="api_url" label="API URL" rules={[{ required: true, message: '请输入 API URL' }]}>
              <Input placeholder="https://example.com/api/data" />
            </Form.Item>
          )}

          {subType === 'offline' && (
            <Form.Item label="上传文件">
              <Upload beforeUpload={() => false} maxCount={1}>
                <Button icon={<UploadOutlined />}>上传文件</Button>
              </Upload>
            </Form.Item>
          )}
        </Form>
      </div>
    )
  }

  // ---- 列表视图 ----
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>订阅管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建订阅</Button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="ID / 名称搜索"
          allowClear
          style={{ width: 200 }}
          onSearch={setFilterName}
          onChange={(e) => !e.target.value && setFilterName('')}
        />
        <Select
          placeholder="创建人"
          allowClear
          style={{ width: 140 }}
          // 暂无创建人列表接口，留作扩展
        />
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          value={filterStatus !== '' ? filterStatus : undefined}
          onChange={(v) => setFilterStatus(v === undefined ? '' : v)}
        >
          <Option value={1}>开启</Option>
          <Option value={0}>停用</Option>
        </Select>
        <Select
          placeholder="类型"
          allowClear
          style={{ width: 140 }}
          value={filterType || undefined}
          onChange={(v) => setFilterType(v || '')}
        >
          <Option value="sql">SQL</Option>
          <Option value="api">API</Option>
          <Option value="offline">离线上传</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={{ total, pageSize, current: page, onChange: setPage }}
        scroll={{ x: 900 }}
      />
    </div>
  )
}

export default SubscriptionList
