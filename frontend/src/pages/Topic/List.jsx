import React, { useState, useEffect } from 'react'
import {
  Table, Button, Input, Tag, Space, message,
  Modal, Form, Typography, Popconfirm, Divider, List, Spin
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons'
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

  // 订阅管理
  const [subModalOpen, setSubModalOpen] = useState(false)
  const [subTopic, setSubTopic] = useState(null)
  const [subscribers, setSubscribers] = useState([])
  const [subLoading, setSubLoading] = useState(false)
  const [addAccountId, setAddAccountId] = useState('')
  const [addLoading, setAddLoading] = useState(false)

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

  const openSubModal = async (record) => {
    setSubTopic(record)
    setSubModalOpen(true)
    setAddAccountId('')
    await fetchSubscribers(record)
  }

  const fetchSubscribers = async (record) => {
    setSubLoading(true)
    try {
      const res = await axios.get(`${BASE}/subscribers`, {
        params: { project_id: currentProject.project_id, topic_key: record.topic_key },
      })
      setSubscribers(res.data.account_ids || [])
    } catch {
      message.error('获取订阅者失败')
    } finally {
      setSubLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!addAccountId.trim()) return message.warning('请输入 Account ID')
    setAddLoading(true)
    try {
      await axios.post(`${BASE}/${subTopic.topic_key}/subscribe`, {
        project_id: currentProject.project_id,
        account_id: addAccountId.trim(),
      })
      message.success('订阅成功')
      setAddAccountId('')
      await fetchSubscribers(subTopic)
      fetchTopics()
    } catch (err) {
      message.error(err.response?.data?.error || '订阅失败')
    } finally {
      setAddLoading(false)
    }
  }

  const handleUnsubscribe = async (accountId) => {
    try {
      await axios.post(`${BASE}/${subTopic.topic_key}/unsubscribe`, {
        project_id: currentProject.project_id,
        account_id: accountId,
      })
      message.success('已取消订阅')
      await fetchSubscribers(subTopic)
      fetchTopics()
    } catch {
      message.error('取消订阅失败')
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
          <Button type="link" icon={<TeamOutlined />} onClick={() => openSubModal(record)}>订阅管理</Button>
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

      {/* 新建/编辑 Modal */}
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

      {/* 订阅管理 Modal */}
      <Modal
        title={`订阅管理 — ${subTopic?.name || ''}`}
        open={subModalOpen}
        onCancel={() => setSubModalOpen(false)}
        footer={null}
        width={520}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">手动为玩家添加/移除订阅</Text>
        </div>
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="输入 Account ID"
            value={addAccountId}
            onChange={e => setAddAccountId(e.target.value)}
            onPressEnter={handleSubscribe}
          />
          <Button type="primary" icon={<UserAddOutlined />} loading={addLoading} onClick={handleSubscribe}>
            添加订阅
          </Button>
        </Space.Compact>

        <Divider style={{ margin: '8px 0 12px' }}>
          当前订阅者 <Tag color="blue">{subscribers.length}</Tag>
        </Divider>

        <Spin spinning={subLoading}>
          {subscribers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '16px 0' }}>暂无订阅者</div>
          ) : (
            <List
              size="small"
              dataSource={subscribers}
              style={{ maxHeight: 300, overflowY: 'auto' }}
              renderItem={accountId => (
                <List.Item
                  actions={[
                    <Popconfirm title="确认取消该用户的订阅？" onConfirm={() => handleUnsubscribe(accountId)}>
                      <Button type="link" danger size="small" icon={<UserDeleteOutlined />}>移除</Button>
                    </Popconfirm>
                  ]}
                >
                  <Text code>{accountId}</Text>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Modal>
    </div>
  )
}

export default TopicList
