import React, { useState, useEffect } from 'react'
import {
  Table, Button, Input, Select, Tag, Space, message,
  Dropdown, Tooltip, Modal, Form, Drawer, Badge,
  Divider, Typography, Popconfirm
} from 'antd'
import {
  PlusOutlined, EditOutlined, SettingOutlined,
  SearchOutlined, QuestionCircleOutlined, UnorderedListOutlined,
  DeleteOutlined, MinusCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select
const { Text } = Typography

const PLATFORMS = [
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
  { value: 'all', label: '全平台' },
]

const SOURCES = [
  { value: 'kafka', label: 'Kafka' },
  { value: 'bigquery', label: 'BigQuery' },
]

const PARAM_TYPES = [
  { value: 'STRING', label: '字符串' },
  { value: 'NUMBER', label: '数值' },
  { value: 'BOOLEAN', label: '布尔' },
  { value: 'TIMESTAMP', label: '时间戳' },
  { value: 'JSON', label: 'JSON' },
]

const platformColor = (val) => {
  if (val === 'android') return 'green'
  if (val === 'ios') return 'blue'
  return 'default'
}

const platformLabel = (val) => {
  const found = PLATFORMS.find(p => p.value === val)
  return found ? found.label : val || '-'
}

const EventManagementList = () => {
  const { currentProject } = useCurrentProject()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [platformFilter, setPlatformFilter] = useState('全部')

  // 编辑显示名/备注
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [editForm] = Form.useForm()

  // 新建事件
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm] = Form.useForm()

  // 事件参数详情 Drawer
  const [paramsDrawerOpen, setParamsDrawerOpen] = useState(false)
  const [paramsRecord, setParamsRecord] = useState(null)

  const fetchEvents = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      const params = {
        project_id: currentProject.project_id,
        page: currentPage,
        page_size: pageSize,
      }
      if (searchText) params.search = searchText
      if (platformFilter !== '全部') params.platform = platformFilter
      const res = await axios.get('/api/v1/profile/events', { params })
      setEvents(res.data.events || [])
      setTotal(res.data.total || 0)
    } catch {
      message.error('获取事件列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [currentProject, currentPage, pageSize, searchText, platformFilter])

  const handleEditSave = async (values) => {
    try {
      await axios.put(`/api/v1/profile/events/${editingRecord.event_name}`, values)
      message.success('保存成功')
      setEditModalOpen(false)
      fetchEvents()
    } catch {
      message.error('保存失败')
    }
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: `确认删除事件 "${record.event_name}"？`,
      content: '删除后将无法恢复，且相关参数定义也会一并删除。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await axios.delete(`/api/v1/profile/events/${record.event_name}`, {
            params: { project_id: currentProject.project_id },
          })
          message.success('删除成功')
          fetchEvents()
        } catch {
          message.error('删除失败')
        }
      },
    })
  }

  const handleCreate = async (values) => {
    try {
      const payload = {
        ...values,
        project_id: currentProject.project_id,
        event_params: values.event_params || [],
      }
      await axios.post('/api/v1/profile/events', payload)
      message.success('创建成功')
      setCreateModalOpen(false)
      createForm.resetFields()
      fetchEvents()
    } catch {
      message.error('创建失败')
    }
  }

  const toggleHidden = async (record) => {
    try {
      await axios.put(`/api/v1/profile/events/${record.event_name}/display`, {
        hidden: !record.hidden,
        project_id: currentProject.project_id,
      })
      message.success('操作成功')
      fetchEvents()
    } catch {
      message.error('操作失败')
    }
  }

  const getActionMenu = (record) => ({
    items: [
      {
        key: 'toggle',
        label: record.hidden ? '显示' : '隐藏',
        onClick: () => toggleHidden(record),
      },
      {
        key: 'delete',
        label: <span style={{ color: '#ff4d4f' }}>删除</span>,
        onClick: () => handleDelete(record),
      },
    ],
  })

  const columns = [
    {
      title: (
        <span>
          事件名&nbsp;
          <span style={{ color: '#aaa', fontWeight: 400 }}>显示名</span>&nbsp;
          <span style={{ color: '#aaa', fontWeight: 400 }}>备注</span>
        </span>
      ),
      key: 'event_name',
      width: 300,
      render: (_, record) => (
        <div>
          <a
            style={{ color: '#1677ff' }}
            onClick={() => { setParamsRecord(record); setParamsDrawerOpen(true) }}
          >
            {record.event_name}
          </a>
          {record.display_name
            ? <span style={{ color: '#666', marginLeft: 12 }}>{record.display_name}</span>
            : <span style={{ color: '#ccc', marginLeft: 12 }}>-</span>}
          {record.remark
            ? <span style={{ color: '#aaa', marginLeft: 12 }}>{record.remark}</span>
            : <span style={{ color: '#ccc', marginLeft: 6 }}>-</span>}
        </div>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (val) => (
        <Tag color={platformColor(val)}>{platformLabel(val)}</Tag>
      ),
      filters: PLATFORMS.map(p => ({ text: p.label, value: p.value })),
      onFilter: (value, record) => record.platform === value,
    },
    {
      title: (
        <span>
          来源&nbsp;
          <Tooltip title="数据接入来源：Kafka 实时上报 / BigQuery 离线同步"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'resource',
      key: 'resource',
      width: 110,
      render: (val) => {
        const found = SOURCES.find(s => s.value === val)
        const label = found ? found.label : val || '-'
        return <Tag color={val === 'kafka' ? 'orange' : 'purple'}>{label}</Tag>
      },
      filters: SOURCES.map(s => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.resource === value,
    },
    {
      title: (
        <span>
          事件参数&nbsp;
          <Tooltip title="该事件上报时携带的参数，点击事件名可查看详情"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'param_count',
      key: 'param_count',
      width: 120,
      render: (val, record) => (
        <a
          style={{ color: '#1677ff' }}
          onClick={() => { setParamsRecord(record); setParamsDrawerOpen(true) }}
        >
          <UnorderedListOutlined style={{ marginRight: 4 }} />
          {val ?? 0} 个参数
        </a>
      ),
    },
    {
      title: (
        <span>
          实时可用&nbsp;
          <Tooltip title="是否可用于实时分群和运营策略"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'realtime_available',
      key: 'realtime_available',
      width: 110,
      render: (val) => (
        <span>
          <span style={{ color: val ? '#1677ff' : '#ff4d4f', marginRight: 4 }}>●</span>
          {val ? '可用' : '不可用'}
        </span>
      ),
      filters: [{ text: '可用', value: true }, { text: '不可用', value: false }],
      onFilter: (value, record) => !!record.realtime_available === value,
    },
    {
      title: (
        <span>
          数据状态&nbsp;
          <Tooltip title="是否已有数据接入"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'data_status',
      key: 'data_status',
      width: 110,
      render: (val) => {
        if (val === 'normal') return <Badge status="success" text="正常" />
        if (val === 'disconnected') return <Badge status="default" text="未接通" />
        return <Badge status="default" text={val || '-'} />
      },
      filters: [{ text: '正常', value: 'normal' }, { text: '未接通', value: 'disconnected' }],
      onFilter: (value, record) => record.data_status === value,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRecord(record)
                editForm.setFieldsValue({
                  display_name: record.display_name,
                  remark: record.remark,
                })
                setEditModalOpen(true)
              }}
            />
          </Tooltip>
          <Dropdown menu={getActionMenu(record)} trigger={['click']}>
            <Tooltip title="更多操作">
              <Button type="text" size="small" icon={<SettingOutlined />} />
            </Tooltip>
          </Dropdown>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          事件管理
          <Tooltip title="管理 App 上报的所有事件及其参数定义，支持 Kafka 实时流和 BigQuery 离线数据">
            <QuestionCircleOutlined style={{ marginLeft: 6, color: '#aaa' }} />
          </Tooltip>
        </span>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            新建事件
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Space>
          <span style={{ fontSize: 13 }}>平台</span>
          <Select value={platformFilter} onChange={setPlatformFilter} style={{ width: 110 }}>
            <Option value="全部">全部</Option>
            {PLATFORMS.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
          </Select>
        </Space>
        <Input
          placeholder="搜索事件名 / 显示名"
          prefix={<SearchOutlined />}
          style={{ width: 220, marginLeft: 'auto' }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={events}
        rowKey="event_name"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size) },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t) => `共 ${t} 条`,
          showQuickJumper: true,
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />

      {/* 事件参数详情 Drawer */}
      <Drawer
        title={
          <span>
            事件参数详情
            {paramsRecord && (
              <Text code style={{ marginLeft: 8, fontSize: 13 }}>{paramsRecord.event_name}</Text>
            )}
          </span>
        }
        open={paramsDrawerOpen}
        onClose={() => setParamsDrawerOpen(false)}
        width={560}
      >
        {paramsRecord && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space size={12}>
                <Tag color={platformColor(paramsRecord.platform)}>{platformLabel(paramsRecord.platform)}</Tag>
                {paramsRecord.resource && (
                  <Tag color={paramsRecord.resource === 'kafka' ? 'orange' : 'purple'}>
                    {paramsRecord.resource === 'kafka' ? 'Kafka' : 'BigQuery'}
                  </Tag>
                )}
                {paramsRecord.display_name && <span style={{ color: '#666' }}>{paramsRecord.display_name}</span>}
              </Space>
              {paramsRecord.remark && (
                <div style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>{paramsRecord.remark}</div>
              )}
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontWeight: 500, marginBottom: 12 }}>
              事件参数
              <Text type="secondary" style={{ fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                共 {paramsRecord.event_params?.length ?? 0} 个
              </Text>
            </div>
            {paramsRecord.event_params?.length > 0 ? (
              <Table
                size="small"
                dataSource={paramsRecord.event_params}
                rowKey="param_name"
                pagination={false}
                columns={[
                  {
                    title: '参数名',
                    dataIndex: 'param_name',
                    key: 'param_name',
                    render: (v) => <Text code>{v}</Text>,
                  },
                  {
                    title: '类型',
                    dataIndex: 'param_type',
                    key: 'param_type',
                    width: 100,
                    render: (v) => {
                      const found = PARAM_TYPES.find(t => t.value === v)
                      return <Tag>{found ? found.label : v || '-'}</Tag>
                    },
                  },
                  {
                    title: '显示名',
                    dataIndex: 'display_name',
                    key: 'display_name',
                    render: (v) => v || <span style={{ color: '#ccc' }}>-</span>,
                  },
                  {
                    title: '必填',
                    dataIndex: 'required',
                    key: 'required',
                    width: 60,
                    render: (v) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag>,
                  },
                ]}
              />
            ) : (
              <div style={{ color: '#aaa', textAlign: 'center', padding: '24px 0' }}>暂无参数定义</div>
            )}
          </>
        )}
      </Drawer>

      {/* 编辑显示名/备注 Modal */}
      <Modal
        title="编辑事件"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave} style={{ marginTop: 16 }}>
          <Form.Item label="事件名">
            <Input value={editingRecord?.event_name} disabled />
          </Form.Item>
          <Form.Item name="display_name" label="显示名">
            <Input placeholder="请输入显示名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建事件 Modal */}
      <Modal
        title="新建事件"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields() }}
        onOk={() => createForm.submit()}
        okText="确定"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item
            name="event_name"
            label="事件名"
            rules={[
              { required: true, message: '请输入事件名' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '仅支持字母、数字、下划线，且以字母开头' },
            ]}
          >
            <Input placeholder="如：btn_click、level_start（英文字母/数字/下划线）" />
          </Form.Item>
          <Form.Item name="display_name" label="显示名">
            <Input placeholder="请输入显示名" />
          </Form.Item>
          <Form.Item name="platform" label="平台" rules={[{ required: true, message: '请选择平台' }]}>
            <Select placeholder="请选择平台">
              {PLATFORMS.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="resource" label="来源">
            <Select placeholder="请选择数据来源" allowClear>
              {SOURCES.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="请输入备注" />
          </Form.Item>

          <Divider style={{ margin: '8px 0 16px' }}>事件参数</Divider>
          <Form.List name="event_params">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'param_name']}
                      rules={[{ required: true, message: '请输入参数名' }]}
                      style={{ flex: 2, marginBottom: 0 }}
                    >
                      <Input placeholder="参数名（如 btn_name）" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'param_type']}
                      rules={[{ required: true, message: '请选择类型' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Select placeholder="类型">
                        {PARAM_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'display_name']}
                      style={{ flex: 1.5, marginBottom: 0 }}
                    >
                      <Input placeholder="显示名（可选）" />
                    </Form.Item>
                    <Button
                      type="text"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                      style={{ marginTop: 4 }}
                      danger
                    />
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  添加参数
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}

export default EventManagementList
