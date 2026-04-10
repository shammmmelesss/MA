import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message } from 'antd'
import {
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckOutlined, 
  CloseOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select
const { TextArea } = Input

const TagList = () => {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingTag, setEditingTag] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  
  // 获取当前项目
  const { currentProject } = useCurrentProject()
  

  // 标签类型选项
  const tagTypeOptions = [
    { value: 'base', label: '基础' },
    { value: 'behavior', label: '行为' },
    { value: 'trade', label: '交易' },
    { value: 'game', label: '游戏专属' },
    { value: 'custom', label: '自定义' }
  ]

  // 数据类型选项
  const dataTypeOptions = [
    { value: 'string', label: '字符串' },
    { value: 'number', label: '数字' },
    { value: 'boolean', label: '布尔值' },
    { value: 'datetime', label: '日期时间' }
  ]

  // 标签分类选项（模拟数据）
  const categoryOptions = [
    { value: 'cat_001', label: '基础标签' },
    { value: 'cat_002', label: '行为标签' },
    { value: 'cat_003', label: '交易标签' },
    { value: 'cat_004', label: '游戏专属标签' },
    { value: 'cat_005', label: '自定义标签' }
  ]

  // 获取标签列表
  const fetchTags = async (params = {}) => {
    if (!currentProject) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const response = await axios.get('/api/v1/profile/tags', {
        params: {
          project_id: currentProject.project_id,
          page: params.page || currentPage,
          page_size: params.pageSize || pageSize,
          ...params.filter
        }
      })
      setTags(response.data.tags || [])
      setTotal(response.data.total || 0)
      setCurrentPage(params.page || currentPage)
      setPageSize(params.pageSize || pageSize)
      message.success('获取标签列表成功')
    } catch (error) {
      message.error('获取标签列表失败')
      console.error('Failed to fetch tags:', error)
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取标签列表，项目切换时重新获取
  useEffect(() => {
    fetchTags()
  }, [currentProject])

  // 打开创建/编辑模态框
  const showModal = (tag = null) => {
    setEditingTag(tag)
    if (tag) {
      form.setFieldsValue({
        tag_code: tag.tag_code,
        tag_name: tag.tag_name,
        tag_type: tag.tag_type,
        data_type: tag.data_type,
        description: tag.description,
        is_system: tag.is_system,
        is_active: tag.is_active
      })
    } else {
      form.resetFields()
    }
    setVisible(true)
  }

  // 关闭模态框
  const handleCancel = () => {
    setVisible(false)
    setEditingTag(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      // 添加项目ID到请求数据中
      const tagData = {
        ...values,
        project_id: currentProject.project_id
      }
      
      if (editingTag) {
        // 更新标签
        await axios.put(`/api/v1/profile/tags/${editingTag.tag_code}`, tagData)
        message.success('标签更新成功')
      } else {
        // 创建标签
        await axios.post('/api/v1/profile/tags', tagData)
        message.success('标签创建成功')
      }
      setVisible(false)
      fetchTags()
      setEditingTag(null)
      form.resetFields()
    } catch (error) {
      message.error(editingTag ? '标签更新失败' : '标签创建失败')
      console.error('Failed to save tag:', error)
    }
  }

  // 删除标签
  const handleDelete = async (tagCode) => {
    try {
      await axios.delete(`/api/v1/profile/tags/${tagCode}`)
      message.success('标签删除成功')
      fetchTags()
    } catch (error) {
      message.error('标签删除失败')
      console.error('Failed to delete tag:', error)
    }
  }

  // 启用/禁用标签
  const handleToggleStatus = async (tagCode, currentStatus) => {
    try {
      if (currentStatus === 1) {
        await axios.post(`/api/v1/profile/tags/${tagCode}/disable`)
        message.success('标签已禁用')
      } else {
        await axios.post(`/api/v1/profile/tags/${tagCode}/enable`)
        message.success('标签已启用')
      }
      fetchTags()
    } catch (error) {
      message.error(currentStatus === 1 ? '标签禁用失败' : '标签启用失败')
      console.error('Failed to toggle tag status:', error)
    }
  }

  // 查看标签详情
  const handleViewDetails = (tag) => {
    // 这里可以实现查看标签详情的逻辑
    message.info('查看标签详情：' + tag.tag_name)
  }

  // 查看标签统计
  const handleViewStatistics = (tagCode) => {
    // 这里可以实现查看标签统计的逻辑
    message.info('查看标签统计：' + tagCode)
  }

  // 表格列配置
  const columns = [
    {
      title: '标签编码',
      dataIndex: 'tag_code',
      key: 'tag_code',
    },
    {
      title: '标签名称',
      dataIndex: 'tag_name',
      key: 'tag_name',
    },
    {
      title: '标签类型',
      dataIndex: 'tag_type',
      key: 'tag_type',
      render: (type) => {
        const typeMap = {
          'base': '基础',
          'behavior': '行为',
          'trade': '交易',
          'game': '游戏专属',
          'custom': '自定义'
        }
        return typeMap[type] || type
      }
    },
    {
      title: '数据类型',
      dataIndex: 'data_type',
      key: 'data_type',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200
    },
    {
      title: '是否系统标签',
      dataIndex: 'is_system',
      key: 'is_system',
      render: (isSystem) => {
        return isSystem === 1 ? (
          <Tag color="blue">是</Tag>
        ) : (
          <Tag color="gray">否</Tag>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => {
        return isActive === 1 ? (
          <Tag color="green">启用</Tag>
        ) : (
          <Tag color="red">禁用</Tag>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      ellipsis: true
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<BarChartOutlined />} 
            onClick={() => handleViewStatistics(record.tag_code)}
          >
            统计
          </Button>
          <Button 
            type={record.is_active === 1 ? 'link' : 'link'} 
            icon={record.is_active === 1 ? <CloseOutlined /> : <CheckOutlined />} 
            onClick={() => handleToggleStatus(record.tag_code, record.is_active)}
          >
            {record.is_active === 1 ? '禁用' : '启用'}
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.tag_code)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 分页变化处理
  const handlePageChange = (page, size) => {
    fetchTags({ page, pageSize: size })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>标签管理</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => showModal()}
        >
          创建标签
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={tags} 
        rowKey="tag_code" 
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: handlePageChange,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingTag ? '编辑标签' : '创建标签'}
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
          {editingTag && (
            <Form.Item
              name="tag_code"
              label="标签编码"
              rules={[{ required: true, message: '请输入标签编码' }]}
            >
              <Input placeholder="请输入标签编码" disabled />
            </Form.Item>
          )}
          
          <Form.Item
            name="tag_name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>

          <Form.Item
            name="tag_type"
            label="标签类型"
            rules={[{ required: true, message: '请选择标签类型' }]}
          >
            <Select placeholder="请选择标签类型">
              {tagTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="data_type"
            label="数据类型"
            rules={[{ required: true, message: '请选择数据类型' }]}
          >
            <Select placeholder="请选择数据类型">
              {dataTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea placeholder="请输入标签描述" rows={4} />
          </Form.Item>

          {editingTag && (
            <Form.Item
              name="is_system"
              label="是否系统标签"
              rules={[{ required: true, message: '请选择是否系统标签' }]}
            >
              <Select placeholder="请选择是否系统标签">
                <Option value={1}>是</Option>
                <Option value={0}>否</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="is_active"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTag ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TagList
