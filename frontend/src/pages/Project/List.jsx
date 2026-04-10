import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, QuestionCircleOutlined } from '@ant-design/icons'
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

// 模拟项目负责人数据
const projectManagers = [
  { value: 'user1', label: '张三' },
  { value: 'user2', label: '李四' },
  { value: 'user3', label: '王五' },
  { value: 'user4', label: '赵六' },
]

// 生成随机AccessKey
const generateAccessKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const ProjectList = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingProject, setEditingProject] = useState(null)
  const { refreshProjects } = useProjects()

  // 状态选项
  const statusOptions = [
    { value: 1, label: '正常' },
    { value: 0, label: '禁用' }
  ]

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

  // 组件挂载时获取项目列表
  useEffect(() => {
    fetchProjects()
  }, [])

  // 打开创建/编辑模态框
  const showModal = (project = null) => {
    setEditingProject(project)
    setVisible(true)
  }

  // 当 Modal 打开时，设置表单值
  useEffect(() => {
    if (visible && editingProject) {
      // 编辑模式：填充项目数据
      form.setFieldsValue({
        project_name: editingProject.project_name,
        description: editingProject.description,
        status: editingProject.status,
        project_manager: editingProject.project_manager,
        app_packages: editingProject.app_packages || [],
        firebase_project_id: editingProject.firebase_project_id,
        access_key: editingProject.access_key,
      })
    } else if (visible && !editingProject) {
      // 创建模式：重置表单并设置默认值
      form.resetFields()
      form.setFieldsValue({
        access_key: generateAccessKey(),
        status: 1
      })
    }
  }, [visible, editingProject, form])

  // 复制AccessKey到剪贴板
  const copyAccessKey = () => {
    const accessKey = form.getFieldValue('access_key')
    if (accessKey) {
      navigator.clipboard.writeText(accessKey)
      message.success('AccessKey已复制到剪贴板')
    }
  }

  // 关闭模态框
  const handleCancel = () => {
    setVisible(false)
    setEditingProject(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingProject) {
        // 更新项目
        values.modifier = 'current_user'
        await axios.put(`/api/v1/projects/${editingProject.project_id}`, values)
        message.success('项目更新成功')
      } else {
        // 创建项目
        values.creator = 'current_user'
        await axios.post('/api/v1/projects', values)
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

  // 删除项目
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

  // 表格列配置
  const columns = [
    {
      title: '项目ID',
      dataIndex: 'project_id',
      key: 'project_id',
    },
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        return status === 1 ? '正常' : '禁用'
      }
    },
    {
      title: (
        <Tooltip title="仅展示有项目权限的用户">
          <span>
            项目负责人 <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </span>
        </Tooltip>
      ),
      dataIndex: 'project_manager',
      key: 'project_manager',
      render: (val) => {
        if (!val) return '-'
        if (Array.isArray(val)) {
          return (
            <Space size="small">
              {val.map((v, index) => {
                const matched = projectManagers.find(m => m.value === v)
                return (
                  <Tag key={index}>{matched ? matched.label : v}</Tag>
                )
              })}
            </Space>
          )
        }
        const matched = projectManagers.find(m => m.value === val)
        return matched ? matched.label : val
      }
    },
    {
      title: '关联App包',
      key: 'app_packages',
      dataIndex: 'app_packages',
      render: (packages) => (
        <Space size="small">
          {packages?.map((pkg, index) => {
            const matched = appPackages.find(ap => ap.value === pkg)
            return (
              <Tag 
                key={index} 
                color={matched?.platform === 'android' ? 'blue' : 'green'}
              >
                {matched?.platform === 'android' ? 'Android: ' : 'iOS: '}
                {pkg}
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
      title: 'AccessKey',
      dataIndex: 'access_key',
      key: 'access_key',
      render: (access_key) => (
        access_key ? (
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {access_key.substring(0, 8)}...{access_key.substring(access_key.length - 8)}
          </span>
        ) : '-'
      ),
    },

    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      render: (time) => {
        if (!time) return '-'
        const date = new Date(time)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
    },
    {
      title: '修改人',
      dataIndex: 'modifier',
      key: 'modifier',
    },
    {
      title: '修改时间',
      dataIndex: 'update_time',
      key: 'update_time',
      render: (time) => {
        if (!time) return '-'
        const date = new Date(time)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
            style={{ marginRight: 8 }}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.project_id)}
          >
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
          columns={columns.map(column => {
            if (column.key === 'action') {
              return {
                ...column,
                fixed: 'right'
              };
            }
            return column;
          })}
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
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="project_name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入项目描述" rows={4} />
          </Form.Item>

          <Form.Item
            name="firebase_project_id"
            label="Firebase Project ID"
            rules={[{ required: true, message: '请输入 Firebase Project ID' }]}
          >
            <Input placeholder="请输入 Firebase Project ID" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue={1}
          >
            <Select placeholder="请选择状态">
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="project_manager"
            label={
              <Tooltip title="仅展示有项目权限的用户">
                <span>
                  项目负责人 <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </span>
              </Tooltip>
            }
            rules={[{ required: true, message: '请选择项目负责人' }]}
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择项目负责人"
              options={projectManagers}
            />
          </Form.Item>

          <Form.Item
            name="app_packages"
            label="关联app包"
            rules={[{ required: true, message: '请选择关联App包' }]}
          >
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择App包"
              options={appPackages}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.app_packages !== cur.app_packages}>
            {({ getFieldValue }) => {
              const selected = getFieldValue('app_packages') || []
              const details = selected
                .map(id => appPackages.find(p => p.value === id))
                .filter(Boolean)
              return details.length > 0 ? (
                <Table
                  dataSource={details}
                  columns={appDetailColumns}
                  rowKey="value"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 24 }}
                />
              ) : null
            }}
          </Form.Item>

          <Form.Item
            name="access_key"
            label="AccessKey"
          >
            <Input
              placeholder="自动生成AccessKey"
              readOnly
              style={{ backgroundColor: '#f5f5f5', color: '#999' }}
              suffix={
                <CopyOutlined
                  onClick={copyAccessKey}
                  style={{ cursor: 'pointer', color: '#999' }}
                />
              }
            />
          </Form.Item>



          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingProject ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectList
