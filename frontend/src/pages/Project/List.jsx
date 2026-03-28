import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select

const ProjectList = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingProject, setEditingProject] = useState(null)

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
    if (project) {
      form.setFieldsValue(project)
    } else {
      form.resetFields()
    }
    setVisible(true)
  }

  // 关闭模态框
  const handleCancel = () => {
    setVisible(false)
    setEditingProject(null)
  }

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingProject) {
        // 更新项目
        await axios.put(`/api/v1/projects/${editingProject.project_id}`, values)
        message.success('项目更新成功')
      } else {
        // 创建项目
        await axios.post('/api/v1/projects', values)
        message.success('项目创建成功')
      }
      setVisible(false)
      fetchProjects()
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
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record) => (
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

      <Table 
        columns={columns} 
        dataSource={projects} 
        rowKey="project_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProject ? '编辑项目' : '创建项目'}
        visible={visible}
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
            name="creator"
            label="创建人"
            initialValue="admin"
          >
            <Input placeholder="请输入创建人" />
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
