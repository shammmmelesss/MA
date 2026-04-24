import React, { useState, useEffect } from 'react'
import {
  Table, Button, Input, Select, Tag, Space, message,
  Dropdown, Tooltip, Modal, Form, Radio
} from 'antd'
import {
  PlusOutlined, EditOutlined, LinkOutlined, SettingOutlined,
  SearchOutlined, QuestionCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select

// 属性类型
const ATTR_TYPES = [
  { value: 'user', label: '用户属性' },
  { value: 'virtual', label: '虚拟属性' },
  { value: 'dimension', label: '维度属性' },
]

// 数据类型
const DATA_TYPES = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数值' },
  { value: 'boolean', label: '布尔' },
  { value: 'time', label: '时间' },
  { value: 'list', label: '列表' },
  { value: 'object', label: '对象' },
  { value: 'object_group', label: '对象组' },
]

const statusColor = (val) => (val === '正常' || val === true || val === 1) ? 'green' : 'default'

const UserAttributeList = () => {
  const { currentProject } = useCurrentProject()
  const [attributes, setAttributes] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [displayStatus, setDisplayStatus] = useState('全部')

  // 编辑显示名 Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [editForm] = Form.useForm()

  // 批量设置显示名 Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false)

  // 新建属性 Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createType, setCreateType] = useState('user') // user | virtual
  const [createForm] = Form.useForm()

  const fetchAttributes = async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      const params = {
        project_id: currentProject.project_id,
        page: currentPage,
        page_size: pageSize,
      }
      if (searchText) params.search = searchText
      if (displayStatus !== '全部') params.display_status = displayStatus
      const res = await axios.get('/api/v1/profile/attributes', { params })
      setAttributes(res.data.attributes || [])
      setTotal(res.data.total || 0)
    } catch {
      message.error('获取用户属性失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttributes()
  }, [currentProject, currentPage, pageSize, searchText, displayStatus])

  // 切换隐藏/显示
  const toggleDisplay = async (record) => {
    try {
      await axios.put(`/api/v1/profile/attributes/${record.attr_name}/display`, {
        hidden: !record.hidden,
      })
      message.success('操作成功')
      fetchAttributes()
    } catch {
      message.error('操作失败')
    }
  }

  // 保存显示名/备注编辑
  const handleEditSave = async (values) => {
    try {
      await axios.put(`/api/v1/profile/attributes/${editingRecord.attr_name}`, values)
      message.success('保存成功')
      setEditModalOpen(false)
      fetchAttributes()
    } catch {
      message.error('保存失败')
    }
  }

  // 删除
  const handleDelete = async (record) => {
    Modal.confirm({
      title: `确认删除属性 "${record.attr_name}" ？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await axios.delete(`/api/v1/profile/attributes/${record.attr_name}`)
          message.success('删除成功')
          fetchAttributes()
        } catch {
          message.error('删除失败')
        }
      },
    })
  }

  // 创建属性
  const handleCreate = async (values) => {
    try {
      await axios.post('/api/v1/profile/attributes', { ...values, attr_type: createType })
      message.success('创建成功')
      setCreateModalOpen(false)
      createForm.resetFields()
      fetchAttributes()
    } catch {
      message.error('创建失败')
    }
  }

  // 操作列下拉菜单
  const getActionMenu = (record) => {
    const isObjectType = record.data_type === 'object' || record.data_type === 'object_group'
    const items = [
      {
        key: 'toggle',
        label: record.hidden ? '显示' : '隐藏',
        onClick: () => toggleDisplay(record),
      },
      { key: 'copy', label: '创建副本', onClick: () => message.info('创建副本功能开发中') },
      ...(isObjectType ? [{ key: 'child', label: '创建子属性', onClick: () => message.info('创建子属性功能开发中') }] : []),
      { key: 'dimension', label: '添加维度表', onClick: () => message.info('添加维度表功能开发中') },
      {
        key: 'delete',
        label: <span style={{ color: '#ff4d4f' }}>删除</span>,
        onClick: () => handleDelete(record),
      },
    ]
    return { items }
  }

  const columns = [
    {
      title: (
        <span>
          属性名&nbsp;
          <span style={{ color: '#aaa', fontWeight: 400 }}>显示名</span>&nbsp;
          <span style={{ color: '#aaa', fontWeight: 400 }}>备注</span>
        </span>
      ),
      key: 'attr_name',
      width: 280,
      render: (_, record) => (
        <div>
          <a style={{ color: '#1677ff' }}>{record.attr_name}</a>
          {record.display_name && <span style={{ color: '#666', marginLeft: 12 }}>{record.display_name}</span>}
          {record.remark && <span style={{ color: '#aaa', marginLeft: 12 }}>{record.remark}</span>}
          {!record.display_name && <span style={{ color: '#ccc', marginLeft: 12 }}>-</span>}
          {!record.remark && <span style={{ color: '#ccc', marginLeft: 6 }}>-</span>}
        </div>
      ),
    },
    {
      title: (
        <span>
          属性类型&nbsp;
          <Tooltip title="属性类型可能为 用户属性/虚拟属性/维度属性"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'attr_type',
      key: 'attr_type',
      width: 120,
      render: (val) => {
        const found = ATTR_TYPES.find(t => t.value === val)
        return found ? found.label : val || '用户属性'
      },
      filters: ATTR_TYPES.map(t => ({ text: t.label, value: t.value })),
      onFilter: (value, record) => record.attr_type === value,
    },
    {
      title: (
        <span>
          数据类型&nbsp;
          <Tooltip title="如 文本/数值/布尔/时间/列表/对象/对象组"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'data_type',
      key: 'data_type',
      width: 100,
      render: (val) => {
        const found = DATA_TYPES.find(t => t.value === val)
        return found ? found.label : val || '-'
      },
      filters: DATA_TYPES.map(t => ({ text: t.label, value: t.value })),
      onFilter: (value, record) => record.data_type === value,
    },
    {
      title: (
        <span>
          实时可用状态&nbsp;
          <Tooltip title="是否可用于实时运营"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'realtime_available',
      key: 'realtime_available',
      width: 140,
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
          连接状态&nbsp;
          <Tooltip title="是否已连接来源"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'connected',
      key: 'connected',
      width: 120,
      render: (val) => (
        <span>
          <span style={{ color: val ? '#1677ff' : '#ff4d4f', marginRight: 4 }}>●</span>
          {val ? '已连接' : '未连接'}
        </span>
      ),
      filters: [{ text: '已连接', value: true }, { text: '未连接', value: false }],
      onFilter: (value, record) => !!record.connected === value,
    },
    {
      title: (
        <span>
          数据状态&nbsp;
          <Tooltip title="数据来源是否已接通并可用"><QuestionCircleOutlined /></Tooltip>
        </span>
      ),
      dataIndex: 'data_status',
      key: 'data_status',
      width: 120,
      render: (val) => {
        if (val === '正常' || val === 'normal') return <Tag color="green" icon={<span>✓</span>}> 正常</Tag>
        if (val === '未接通' || val === 'disconnected') return <Tag color="default">未接通</Tag>
        return <Tag color="default">{val || '-'}</Tag>
      },
      filters: [{ text: '正常', value: 'normal' }, { text: '未接通', value: 'disconnected' }],
      onFilter: (value, record) => record.data_status === value,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 110,
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
          <Tooltip title="设置连接关系">
            <Button type="text" size="small" icon={<LinkOutlined />} onClick={() => message.info('连接关系功能开发中')} />
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

  // 新建按钮下拉菜单
  const createMenu = {
    items: [
      {
        key: 'event',
        label: '事件属性',
        onClick: () => message.info('事件属性功能开发中'),
      },
      {
        key: 'virtual_event',
        label: '虚拟事件属性',
        onClick: () => message.info('虚拟事件属性功能开发中'),
      },
    ],
  }

  return (
    <div>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          用户属性
          <Tooltip title="用户属性说明"><QuestionCircleOutlined style={{ marginLeft: 6, color: '#aaa' }} /></Tooltip>
        </span>
        <Space>
          <Button onClick={() => message.info('来源用户属性管理功能开发中')}>
            进入 来源用户属性管理 页面
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setBatchModalOpen(true)}>
            显示名
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'user', label: '用户属性', onClick: () => { setCreateType('user'); setCreateModalOpen(true) } },
                { key: 'virtual', label: '虚拟用户属性', onClick: () => { setCreateType('virtual'); setCreateModalOpen(true) } },
              ],
            }}
            trigger={['hover']}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              用户属性
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Space>
          <span style={{ fontSize: 13 }}>显示状态</span>
          <Select
            value={displayStatus}
            onChange={setDisplayStatus}
            style={{ width: 100 }}
          >
            <Option value="全部">全部</Option>
            <Option value="显示">显示</Option>
            <Option value="隐藏">隐藏</Option>
          </Select>
        </Space>
        <Input
          placeholder="请输入搜索"
          prefix={<SearchOutlined />}
          style={{ width: 200, marginLeft: 'auto' }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={attributes}
        rowKey="attr_name"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          onChange: (page, size) => { setCurrentPage(page); setPageSize(size) },
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t) => `共 ${t} 条记录`,
          showQuickJumper: true,
        }}
        scroll={{ x: 'max-content' }}
        size="middle"
      />

      {/* 编辑显示名/备注 Modal */}
      <Modal
        title="编辑属性"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSave} style={{ marginTop: 16 }}>
          <Form.Item label="属性名">
            <Input value={editingRecord?.attr_name} disabled />
          </Form.Item>
          <Form.Item name="display_name" label="显示名">
            <Input placeholder="请输入显示名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量设置显示名 Modal */}
      <Modal
        title="批量设置用户属性显示名"
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        footer={null}
        width={480}
      >
        <p style={{ color: '#888' }}>请上传 CSV 文件批量设置属性显示名（属性名, 显示名）</p>
        <Button onClick={() => setBatchModalOpen(false)}>关闭</Button>
      </Modal>

      {/* 新建用户属性 Modal */}
      <Modal
        title={createType === 'virtual' ? '创建虚拟用户属性' : '创建用户属性'}
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields() }}
        onOk={() => createForm.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="attr_name" label="属性名" rules={[{ required: true, message: '请输入属性名' }]}>
            <Input placeholder="请输入属性名（英文字母/数字/下划线）" />
          </Form.Item>
          <Form.Item name="display_name" label="显示名">
            <Input placeholder="请输入显示名" />
          </Form.Item>
          <Form.Item name="data_type" label="数据类型" rules={[{ required: true, message: '请选择数据类型' }]}>
            <Select placeholder="请选择数据类型">
              {DATA_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserAttributeList
