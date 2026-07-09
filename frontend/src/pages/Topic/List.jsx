import React, { useState, useEffect } from 'react'
import {
  Table, Button, Input, Tag, Space, message,
  Modal, Form, Typography, Popconfirm
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from 'axios'
import { useCurrentProject } from '../../App.jsx'

const { Text } = Typography
const BASE = '/api/v1/topics'

const TopicList = () => {
  const { currentProject } = useCurrentProject()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [modalOpen, setModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [form] = Form.useForm()

  const fetchTopics = async () => {
    if (!currentProject?.project_id) return
    setLoading(true)
    try {
      const res = await axios.get(BASE, {
        params: { project_id: currentProject.project_id, page, page_size: pageSize },
      })
      setTopics(res.data.topics || [])
      setTotal(res.data.total || 0)
    } catch {
      message.error('获取 topic 列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTopics() }, [currentProject, page])

  const openCreate = () => {
    setEditingTopic(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditingTopic(record)
    form.setFieldsValue({ topic_key: record.topic_key, name: record.name, description: record.description })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      if (editingTopic) {
        await axios.put(`${BASE}/${editingTopic.id}`, { ...values, project_id: currentProject.project_id })
        message.success('更新成功')
      } else {
        await axios.post(BASE, { ...values, project_id: currentProject.project_id })
        message.success('创建成功')
      }
      setModalOpen(false)
      fetchTopics()
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE}/${id}`)
      message.success('删除成功')
      fetchTopics()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: 'Topic Key',
      dataIndex: 'topic_key',
      key: 'topic_key',
      render: (v) => <Text code>{v}</Text>,
    },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '订阅人数',
      dataIndex: 'sub_count',
      key: 'sub_count',
      render: (v) => <Tag color="blue">{v ?? 0}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>,
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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Topic 管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建 Topic</Button>
      </div>

      <Table
        columns={columns}
        dataSource={topics}
        rowKey="id"
        loading={loading}
        pagination={{ total, pageSize, current: page, onChange: setPage }}
      />

      <Modal
        title={editingTopic ? '编辑 Topic' : '新建 Topic'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="topic_key"
            label="Topic Key"
            rules={[
              { required: true, message: '请输入 Topic Key' },
              { pattern: /^[a-z0-9_]+$/, message: '只允许小写字母、数字和下划线' },
            ]}
          >
            <Input placeholder="如：promotion" disabled={!!editingTopic} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：活动推广" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="可选，描述该 topic 的用途" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TopicList
