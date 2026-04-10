import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select

const AppList = () => {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [editingApp, setEditingApp] = useState(null)
  const { currentProject } = useCurrentProject()

  // 状态选项
  const statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'reviewing', label: '审核中' },
    { value: 'online', label: '已上线' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'disabled', label: '已禁用' }
  ]

  // 平台类型选项
  const platformOptions = [
    { value: 'Android', label: 'Android' },
    { value: 'iOS', label: 'iOS' },
    { value: '双平台', label: '双平台' }
  ]

  // 获取App列表
  const fetchApps = async (searchParams = {}) => {
    if (!currentProject) return
    setLoading(true)
    try {
      const response = await axios.get('/api/v1/apps', {
        params: { project_id: currentProject.project_id, ...searchParams }
      })
      setApps(response.data.apps)
    } catch (error) {
      message.error('获取App列表失败')
      console.error('Failed to fetch apps:', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取App列表，项目切换时重新获取
  useEffect(() => {
    fetchApps()
  }, [currentProject])

  // 打开创建/编辑模态框
  const showModal = (app = null) => {
    setEditingApp(app)
    if (app) {
      form.setFieldsValue(app)
    } else {
      form.resetFields()
    }
    setVisible(true)
  }

  // 关闭模态框
  const handleCancel = () => {
    setVisible(false)
    setEditingApp(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      if (editingApp) {
        // 更新App
        await axios.put(`/api/v1/apps/${editingApp.app_id}`, values)
        message.success('App更新成功')
      } else {
        // 创建App
        await axios.post('/api/v1/apps', { ...values, project_id: currentProject?.project_id })
        message.success('App创建成功')
      }
      setVisible(false)
      fetchApps()
      setEditingApp(null)
      form.resetFields()
    } catch (error) {
      message.error(editingApp ? 'App更新失败' : 'App创建失败')
      console.error('Failed to save app:', error)
    }
  }

  // 删除App
  const handleDelete = async (appId) => {
    try {
      await axios.delete(`/api/v1/apps/${appId}`)
      message.success('App删除成功')
      fetchApps()
    } catch (error) {
      message.error('App删除失败')
      console.error('Failed to delete app:', error)
    }
  }

  // 提交审核
  const handleSubmitReview = async (appId) => {
    try {
      await axios.post(`/api/v1/apps/${appId}/submit-review`)
      message.success('App已提交审核')
      fetchApps()
    } catch (error) {
      message.error('提交审核失败')
      console.error('Failed to submit app for review:', error)
    }
  }

  // 审核通过
  const handleApprove = async (appId) => {
    try {
      await axios.post(`/api/v1/apps/${appId}/approve`)
      message.success('App审核通过')
      fetchApps()
    } catch (error) {
      message.error('审核通过失败')
      console.error('Failed to approve app:', error)
    }
  }

  // 审核拒绝
  const handleReject = async (appId) => {
    try {
      await axios.post(`/api/v1/apps/${appId}/reject`, { reason: '审核不通过' })
      message.success('App审核拒绝')
      fetchApps()
    } catch (error) {
      message.error('审核拒绝失败')
      console.error('Failed to reject app:', error)
    }
  }

  // 启用App
  const handleEnable = async (appId) => {
    try {
      await axios.post(`/api/v1/apps/${appId}/enable`)
      message.success('App已启用')
      fetchApps()
    } catch (error) {
      message.error('启用失败')
      console.error('Failed to enable app:', error)
    }
  }

  // 禁用App
  const handleDisable = async (appId) => {
    try {
      await axios.post(`/api/v1/apps/${appId}/disable`)
      message.success('App已禁用')
      fetchApps()
    } catch (error) {
      message.error('禁用失败')
      console.error('Failed to disable app:', error)
    }
  }

  // 表格列配置
  const columns = [
    {
      title: 'AppID',
      dataIndex: 'app_id',
      key: 'app_id',
    },
    {
      title: '游戏名称',
      dataIndex: 'game_name',
      key: 'game_name',
    },
    {
      title: '包名',
      dataIndex: 'package_name',
      key: 'package_name',
    },
    {
      title: '平台类型',
      dataIndex: 'platform_type',
      key: 'platform_type',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'draft': '草稿',
          'reviewing': '审核中',
          'online': '已上线',
          'rejected': '已拒绝',
          'disabled': '已禁用'
        }
        return statusMap[status] || status
      }
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
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
          <a 
            href="javascript:void(0)" 
            style={{ color: '#ff4d4f', marginRight: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            onClick={() => handleDelete(record.app_id)}
          >
            <DeleteOutlined style={{ marginRight: 4 }} /> 删除
          </a>
          {record.status === 'draft' && (
            <Button 
              type="link" 
              icon={<CheckOutlined />} 
              onClick={() => handleSubmitReview(record.app_id)}
              style={{ marginRight: 8 }}
            >
              提交审核
            </Button>
          )}
          {record.status === 'reviewing' && (
            <>
              <Button 
                type="link" 
                icon={<CheckOutlined />} 
                onClick={() => handleApprove(record.app_id)}
                style={{ marginRight: 8 }}
              >
                审核通过
              </Button>
              <Button 
                type="link" 
                danger 
                icon={<CloseOutlined />} 
                onClick={() => handleReject(record.app_id)}
                style={{ marginRight: 8 }}
              >
                审核拒绝
              </Button>
            </>
          )}
          {record.status === 'online' && (
            <Button 
              type="link" 
              danger 
              icon={<PauseCircleOutlined />} 
              onClick={() => handleDisable(record.app_id)}
              style={{ marginRight: 8 }}
            >
              禁用
            </Button>
          )}
          {(record.status === 'disabled' || record.status === 'rejected') && (
            <Button 
              type="link" 
              icon={<PlayCircleOutlined />} 
              onClick={() => handleEnable(record.app_id)}
              style={{ marginRight: 8 }}
            >
              启用
            </Button>
          )}
        </>
      ),
    },
  ]

  // 搜索App
  const handleSearch = async (values) => {
    // 转换搜索参数为后端所需格式
    const searchParams = {
      game_name: values.game_name,
      status: values.status,
      platform_type: values.platform_type,
      package_name: values.package_name,
      app_id: values.app_id
    }
    
    // 移除空值
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] === undefined || searchParams[key] === '') {
        delete searchParams[key]
      }
    })
    
    fetchApps(searchParams)
  }

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields()
    fetchApps()
  }

  return (
    <div>
      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 16, background: '#fafafa', padding: 16, borderRadius: 8 }}
      >
        <Form.Item name="app_id" label="AppID">
          <Input placeholder="请输入AppID" style={{ width: 200 }} />
        </Form.Item>
        
        <Form.Item name="game_name" label="游戏名称">
          <Input placeholder="请输入游戏名称" style={{ width: 200 }} />
        </Form.Item>
        
        <Form.Item name="package_name" label="包名">
          <Input placeholder="请输入包名" style={{ width: 200 }} />
        </Form.Item>
        
        <Form.Item name="platform_type" label="平台类型">
          <Select placeholder="请选择平台类型" style={{ width: 150 }}>
            {platformOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态" style={{ width: 150 }}>
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
            搜索
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
        </Form.Item>
      </Form>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          创建App
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={apps} 
        rowKey="app_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingApp ? '编辑App' : '创建App'}
        visible={visible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="game_name"
            label="游戏名称"
            rules={[{ required: true, message: '请输入游戏名称' }]}
          >
            <Input placeholder="请输入游戏名称" />
          </Form.Item>

          <Form.Item
            name="package_name"
            label="包名/Bundle ID"
            rules={[{ required: true, message: '请输入包名/Bundle ID' }]}
          >
            <Input placeholder="请输入包名/Bundle ID" />
          </Form.Item>

          <Form.Item
            name="platform_type"
            label="平台类型"
            rules={[{ required: true, message: '请选择平台类型' }]}
          >
            <Select placeholder="请选择平台类型">
              {platformOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="owner"
            label="负责人"
            rules={[{ required: true, message: '请输入负责人' }]}
          >
            <Input placeholder="请输入负责人" />
          </Form.Item>

          <Form.Item
            name="owner_contact"
            label="负责人联系方式"
          >
            <Input placeholder="请输入负责人联系方式" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注" rows={4} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingApp ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppList
