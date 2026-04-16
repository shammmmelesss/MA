import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Tooltip, Radio } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useProjects } from '../../App.jsx'

const { Option } = Select

// 模拟App包数据
const appPackages = [
  { value: '32837129312', label: 'Android：32837129312', name: 'sudoku', platform: 'android', status: '正常' },
  { value: '2898103012', label: 'iOS：2898103012', name: 'bpn', platform: 'ios', status: '下线' },
  { value: '1234567890', label: 'Android：1234567890', name: 'puzzle', platform: 'android', status: '正常' },
  { value: '9876543210', label: 'iOS：9876543210', name: 'runner', platform: 'ios', status: '正常' },
]

// 已选App包详情表列配置
const appDetailColumns = [
  { title: 'ID', dataIndex: 'value', key: 'value' },
  { title: '名字', dataIndex: 'name', key: 'name' },
  { title: '平台', dataIndex: 'platform', key: 'platform' },
  {
    title: '状态', dataIndex: 'status', key: 'status',
    render: (val) => <Tag color={val === '正常' ? 'green' : 'default'}>{val}</Tag>
  },
]

// 模拟关联项目数据
const linkedProjects = [
  { value: '3283712931232', label: 'killer', project_name: 'killer' },
  { value: '1234567890123', label: 'alpha', project_name: 'alpha' },
]

// 已选关联项目详情表列
const linkedProjectColumns = [
  { title: '项目ID', dataIndex: 'value', key: 'value' },
  { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
]

// 模拟项目负责人数据
const projectManagers = [
  { value: 'user1', label: '张三' },
  { value: 'user2', label: '李四' },
  { value: 'user3', label: '王五' },
  { value: 'user4', label: '赵六' },
]

// 生成随机密钥
const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 只读复制输入框
const ReadonlyCopyInput = ({ value, fieldName }) => {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value)
      message.success(`${fieldName}已复制到剪贴板`)
    }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid #d9d9d9', borderRadius: 6, padding: '4px 12px' }}>
      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#333', wordBreak: 'break-all' }}>
        {value || ''}
      </span>
      <Button type="link" size="small" onClick={handleCopy} style={{ padding: '0 0 0 8px', flexShrink: 0 }}>
        复制
      </Button>
    </div>
  )
}

const ProjectList = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingProject, setEditingProject] = useState(null)
  const [keyValue, setKeyValue] = useState('')
  const [secretValue, setSecretValue] = useState('')
  const { refreshProjects } = useProjects()

  // 获取项目列表
  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/v1/projects')
      setProjects(response.data.projects)
    } catch (error) {
      message.error('获取项目列表失败')
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const showModal = (project = null) => {
    setEditingProject(project)
    setVisible(true)
  }

  useEffect(() => {
    if (visible && editingProject) {
      const key = editingProject.access_key || generateKey()
      const secret = editingProject.secret || generateKey()
      setKeyValue(key)
      setSecretValue(secret)
      form.setFieldsValue({
        linked_project: editingProject.linked_project,
        project_name: editingProject.project_name,
        description: editingProject.description,
        status: editingProject.status ?? 1,
        project_manager: editingProject.project_manager,
        app_packages: editingProject.app_packages || [],
        firebase_project_id: editingProject.firebase_project_id,
      })
    } else if (visible && !editingProject) {
      const key = generateKey()
      const secret = generateKey()
      setKeyValue(key)
      setSecretValue(secret)
      form.resetFields()
      form.setFieldsValue({ status: 1 })
    }
  }, [visible, editingProject, form])

  const handleCancel = () => {
    setVisible(false)
    setEditingProject(null)
    form.resetFields()
  }

  const handleSubmit = async (values) => {
    try {
      const payload = { ...values, access_key: keyValue, secret: secretValue }
      if (editingProject) {
        payload.modifier = 'current_user'
        await axios.put(`/api/v1/projects/${editingProject.project_id}`, payload)
        message.success('项目更新成功')
      } else {
        payload.creator = 'current_user'
        await axios.post('/api/v1/projects', payload)
        message.success('项目创建成功')
      }
      setVisible(false)
      fetchProjects()
      refreshProjects()
    } catch (error) {
      message.error(editingProject ? '项目更新失败' : '项目创建失败')
      console.error('Failed to save project:', error)
    }
  }

  const handleDelete = async (projectId) => {
    try {
      await axios.delete(`/api/v1/projects/${projectId}`)
      message.success('项目删除成功')
      fetchProjects()
      refreshProjects()
    } catch (error) {
      message.error('项目删除失败')
      console.error('Failed to delete project:', error)
    }
  }

  const columns = [
    {
      title: '项目ID',
      dataIndex: 'linked_project',
      key: 'project_id',
      render: (linkedProject) => linkedProject || '-',
    },
    {
      title: '项目名称',
      dataIndex: 'linked_project',
      key: 'project_name',
      render: (linkedProject) => {
        const matched = linkedProjects.find(p => p.value === linkedProject)
        return matched ? matched.label : (linkedProject || '-')
      },
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => status === 1 ? '启用' : '停用',
    },
    {
      title: (
        <Tooltip title="仅展示有项目权限的用户">
          <span>项目负责人 <QuestionCircleOutlined style={{ marginLeft: 4 }} /></span>
        </Tooltip>
      ),
      dataIndex: 'project_manager',
      key: 'project_manager',
      render: (val) => {
        if (!val) return '-'
        const arr = Array.isArray(val) ? val : [val]
        return (
          <Space size="small">
            {arr.map((v, i) => {
              const matched = projectManagers.find(m => m.value === v)
              return <Tag key={i}>{matched ? matched.label : v}</Tag>
            })}
          </Space>
        )
      },
    },
    {
      title: '关联App包',
      dataIndex: 'app_packages',
      key: 'app_packages',
      render: (packages) => (
        <Space size="small">
          {packages?.map((pkg, index) => {
            const matched = appPackages.find(ap => ap.value === pkg)
            return (
              <Tag key={index} color={matched?.platform === 'android' ? 'blue' : 'green'}>
                {matched?.platform === 'android' ? 'Android: ' : 'iOS: '}{pkg}
              </Tag>
            )
          })}
          {(!packages || packages.length === 0) && '-'}
        </Space>
      ),
    },
    {
      title: 'Firebase Project ID',
      dataIndex: 'firebase_project_id',
      key: 'firebase_project_id',
      render: (val) => val || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (time) => {
        if (!time) return '-'
        return new Date(time).toLocaleString('zh-CN', { hour12: false })
      },
    },
    { title: '修改人', dataIndex: 'modifier', key: 'modifier' },
    {
      title: '修改时间',
      dataIndex: 'update_time',
      key: 'update_time',
      render: (time) => {
        if (!time) return '-'
        return new Date(time).toLocaleString('zh-CN', { hour12: false })
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <>
          <Button type="link" icon={<EditOutlined />} onClick={() => showModal(record)} style={{ marginRight: 8 }}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.project_id)}>
            删除
          </Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          创建项目
        </Button>
      </div>

      <div style={{ maxHeight: '80vh', overflow: 'auto', width: '100%' }}>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="project_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <Modal
        title={editingProject ? '编辑项目' : '创建项目'}
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>

          {/* 关联项目 */}
          <Form.Item
            name="linked_project"
            label="关联项目"
            rules={[{ required: true, message: '请选择关联项目' }]}
          >
            <Select placeholder="请选择关联项目" allowClear>
              {linkedProjects.map(p => (
                <Option key={p.value} value={p.value}>{p.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* 关联项目详情表 */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.linked_project !== cur.linked_project}>
            {({ getFieldValue }) => {
              const selected = getFieldValue('linked_project')
              const detail = linkedProjects.find(p => p.value === selected)
              return detail ? (
                <Table
                  dataSource={[detail]}
                  columns={linkedProjectColumns}
                  rowKey="value"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 24, marginTop: -16 }}
                />
              ) : null
            }}
          </Form.Item>

          {/* 关联app包 */}
          <Form.Item
            name="app_packages"
            label="关联app包"
            rules={[{ required: true, message: '请选择关联App包' }]}
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择App包"
              tagRender={({ label, value, onClose }) => {
                const pkg = appPackages.find(p => p.value === value)
                const prefix = pkg?.platform === 'android' ? 'Android' : 'iOS'
                return (
                  <Tag
                    color={pkg?.platform === 'android' ? 'blue' : 'green'}
                    closable
                    onClose={onClose}
                    style={{ marginRight: 4 }}
                  >
                    {prefix}：{value}
                  </Tag>
                )
              }}
            >
              {appPackages.map(p => (
                <Option key={p.value} value={p.value}>{p.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* 已选App包详情表 */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.app_packages !== cur.app_packages}>
            {({ getFieldValue }) => {
              const selected = getFieldValue('app_packages') || []
              const details = selected.map(id => appPackages.find(p => p.value === id)).filter(Boolean)
              return details.length > 0 ? (
                <Table
                  dataSource={details}
                  columns={appDetailColumns}
                  rowKey="value"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 24, marginTop: -16 }}
                />
              ) : null
            }}
          </Form.Item>

          {/* 项目负责人 */}
          <Form.Item
            name="project_manager"
            label={
              <Tooltip title="仅展示有项目权限的用户">
                <span>项目负责人 <QuestionCircleOutlined style={{ marginLeft: 4 }} /></span>
              </Tooltip>
            }
            rules={[{ required: true, message: '请选择项目负责人' }]}
          >
            <Select mode="multiple" style={{ width: '100%' }} placeholder="下拉选择" options={projectManagers} />
          </Form.Item>

          {/* firebase projectid */}
          <Form.Item
            name="firebase_project_id"
            label="firebase projectid"
            rules={[{ required: true, message: '请输入 firebase projectid' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>

          {/* key（只读） */}
          <Form.Item label="key">
            <ReadonlyCopyInput value={keyValue} fieldName="key" />
          </Form.Item>

          {/* secret（只读） */}
          <Form.Item label="secret">
            <ReadonlyCopyInput value={secretValue} fieldName="secret" />
          </Form.Item>

          {/* 状态 */}
          <Form.Item name="status" label="状态" initialValue={1}>
            <Radio.Group>
              <Radio value={1}>启用</Radio>
              <Radio value={0}>停用</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 描述 */}
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入" rows={4} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>取消</Button>
            <Button type="primary" htmlType="submit">
              {editingProject ? '更新' : '确定'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectList
