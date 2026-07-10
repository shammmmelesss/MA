import React, { useState, useEffect, useMemo } from 'react'
import {
  Table, Button, Input, Select, Space, message,
  Form, Tag, Popconfirm, Radio, Tooltip, Upload,
  Pagination,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined,
  ArrowLeftOutlined, UploadOutlined, HolderOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import { useCurrentProject } from '../../App.jsx'

const { Option } = Select
const BASE = '/api/v1/image-groups'

const imageTypeMap = {
  notification: '通知图片',
  large: '大图',
  background: '背景图',
  right_large: '右侧大图',
}

const statusMap = {
  enabled: { text: '启用', color: 'success' },
  disabled: { text: '停用', color: 'default' },
}

const newItem = () => ({
  _key: `item_${Date.now()}_${Math.random()}`,
  id: undefined,
  sort: 0,
  item_type: 'image',
  image_url: '',
  link_url: '',
  tags: '',
})

const ImageAssetList = () => {
  const { currentProject } = useCurrentProject()

  // ---- 列表状态 ----
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCreator, setFilterCreator] = useState('')

  // ---- 视图 ----
  const [view, setView] = useState('list') // 'list' | 'form'
  const [editing, setEditing] = useState(null)

  // ---- 表单 ----
  const [form] = Form.useForm()
  const [imageType, setImageType] = useState('notification')
  const [items, setItems] = useState([newItem()])
  const [saving, setSaving] = useState(false)
  const [uploadingRowKey, setUploadingRowKey] = useState(null)

  // ---- 动态提取创建人 ----
  const creatorOptions = useMemo(() => {
    const set = new Set(list.map(r => r.created_by).filter(Boolean))
    return Array.from(set)
  }, [list])

  const fetchList = async () => {
    if (!currentProject?.project_id) return
    setLoading(true)
    try {
      const res = await axios.get(BASE, {
        params: {
          project_id: currentProject.project_id,
          name: filterKeyword || undefined,
          status: filterStatus || undefined,
          page,
          page_size: pageSize,
        },
      })
      setList(res.data.list || [])
      setTotal(res.data.total || 0)
    } catch {
      message.error('获取图片组列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [currentProject, page, filterKeyword, filterStatus])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ name: '', image_type: 'notification', status: 'enabled' })
    setImageType('notification')
    setItems([newItem()])
    setView('form')
  }

  const openEdit = async (record) => {
    setEditing(record)
    try {
      const res = await axios.get(`${BASE}/${record.id}`)
      const data = res.data
      form.setFieldsValue({
        name: data.name,
        image_type: data.image_type,
        status: data.status,
      })
      setImageType(data.image_type)
      const rawItems = (data.items || []).map(it => ({
        _key: `item_${it.id || Date.now()}_${Math.random()}`,
        id: it.id,
        sort: it.sort,
        item_type: it.item_type || 'image',
        image_url: it.image_url || '',
        link_url: it.link_url || '',
        tags: Array.isArray(it.tags) ? it.tags.join(',') : (it.tags || ''),
      }))
      setItems(rawItems.length ? rawItems : [newItem()])
    } catch {
      message.error('获取图片组详情失败')
    }
    setView('form')
  }

  const handleCopy = async (record) => {
    try {
      const res = await axios.get(`${BASE}/${record.id}`)
      const data = res.data
      const payload = {
        project_id: currentProject.project_id,
        name: `${data.name}_copy`,
        image_type: data.image_type,
        status: data.status,
        created_by: data.created_by || '',
        items: (data.items || []).map(it => ({
          sort: it.sort,
          item_type: it.item_type,
          image_url: it.image_url,
          link_url: it.link_url,
          tags: it.tags,
        })),
      }
      await axios.post(BASE, payload)
      message.success('复制成功')
      fetchList()
    } catch {
      message.error('复制失败')
    }
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
      const itemsPayload = items.map((it, idx) => ({
        ...(it.id ? { id: it.id } : {}),
        sort: idx + 1,
        item_type: it.item_type,
        image_url: it.image_url,
        link_url: it.link_url,
        tags: it.tags || '',
      }))
      if (editing) {
        await axios.put(`${BASE}/${editing.id}`, {
          name: values.name,
          image_type: values.image_type,
          status: values.status,
          updated_by: '',
          items: itemsPayload,
        })
        message.success('更新成功')
      } else {
        await axios.post(BASE, {
          project_id: currentProject.project_id,
          name: values.name,
          image_type: values.image_type,
          status: values.status,
          created_by: '',
          items: itemsPayload,
        })
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

  // ---- 图片条目操作 ----
  const addItem = () => {
    setItems(prev => [...prev, newItem()])
  }

  const removeItem = (key) => {
    setItems(prev => prev.filter(it => it._key !== key))
  }

  const updateItem = (key, field, value) => {
    setItems(prev => prev.map(it => it._key === key ? { ...it, [field]: value } : it))
  }

  const handleUploadImage = async (file, rowKey) => {
    setUploadingRowKey(rowKey)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post(`${BASE}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateItem(rowKey, 'image_url', res.data.url)
      message.success('上传成功')
    } catch {
      message.error('上传失败')
    } finally {
      setUploadingRowKey(null)
    }
    return false // prevent ant-design default upload
  }

  // ---- 列表列定义 ----
  const columns = [
    { title: '图片组ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
    {
      title: 'URL（第一条）',
      key: 'first_url',
      width: 200,
      render: (_, record) => {
        const url = record.first_url || ''
        return url ? (
          <Tooltip title={url}>
            <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
              {url}
            </span>
          </Tooltip>
        ) : '-'
      },
    },
    {
      title: '类型',
      dataIndex: 'image_type',
      key: 'image_type',
      width: 110,
      render: v => imageTypeMap[v] || v,
    },
    { title: '图片数量', dataIndex: 'item_count', key: 'item_count', width: 80 },
    { title: '创建人', dataIndex: 'created_by', key: 'created_by', width: 90 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    { title: '修改人', dataIndex: 'updated_by', key: 'updated_by', width: 90 },
    {
      title: '修改时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 140,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: v => {
        const s = statusMap[v] || { text: v, color: 'default' }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '关联',
      key: 'relation',
      width: 70,
      render: () => (
        <Tooltip title="暂无关联任务">
          <span style={{ cursor: 'default', color: '#1677ff' }}>0</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record)}>复制</Button>
          <Popconfirm
            title="确认删除该图片组？"
            description="删除后不可恢复"
            okText="确认"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // ================================================================
  // 表单视图
  // ================================================================
  if (view === 'form') {
    const uploadBatchTooltip = (
      <div style={{ maxWidth: 280 }}>
        <div>1. 每次上传为追加模式，原有内容保留，追加内容；</div>
        <div>2. 仅支持csv格式，点击下载模板 <a href="#" style={{ color: '#40a9ff' }}>模板链接</a></div>
      </div>
    )

    return (
      <div style={{ padding: 24 }}>
        {/* 顶部 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => setView('list')}
              style={{ padding: 0, fontWeight: 500 }}
            >
              {editing ? '编辑图片组' : '创建图片组'}
            </Button>
          </Space>
          <Space>
            <Button onClick={() => setView('list')}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
          </Space>
        </div>

        <Form form={form} layout="vertical" style={{ maxWidth: 900 }}>
          {/* 图片组名称 */}
          <Form.Item
            name="name"
            label={
              <Space size={4}>
                <span>图片组名称</span>
                {imageType === 'large' && (
                  <Tooltip title="尺寸:120*120, 建议不超过300k">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                )}
              </Space>
            }
            rules={[{ required: true, message: '请输入图片组名称' }]}
          >
            <Input placeholder="请输入图片组名称" style={{ width: 240 }} />
          </Form.Item>

          {/* 图片类型 */}
          <Form.Item name="image_type" label="图片类型" rules={[{ required: true, message: '请选择图片类型' }]}>
            <Radio.Group onChange={e => setImageType(e.target.value)}>
              <Radio value="notification">通知图片</Radio>
              <Radio value="large">大图</Radio>
              <Radio value="background">背景图</Radio>
              <Radio value="right_large">右侧大图</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 状态 */}
          <Form.Item name="status" label="状态">
            <Radio.Group>
              <Radio value="enabled">启用</Radio>
              <Radio value="disabled">停用</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 图片列表 */}
          <Form.Item label="图片列表">
            {/* 操作栏 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addItem}>添加</Button>
              <span style={{ color: '#999', fontSize: 13 }}>点击下方新增一条记录</span>
              <div style={{ marginLeft: 'auto' }}>
                <Tooltip title={uploadBatchTooltip} overlayStyle={{ maxWidth: 320 }}>
                  <span style={{ color: '#999', fontSize: 13, cursor: 'pointer' }}>
                    上传图片/URL <QuestionCircleOutlined />
                  </span>
                </Tooltip>
              </div>
            </div>

            {/* 图片条目表格 */}
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
              {/* 表头 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '32px 50px 80px 80px 1fr 140px 100px 80px',
                background: '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                padding: '8px 0',
                fontSize: 13,
                color: '#666',
                fontWeight: 500,
              }}>
                <div />
                <div style={{ textAlign: 'center' }}>序号</div>
                <div style={{ textAlign: 'center' }}>类型</div>
                <div style={{ textAlign: 'center' }}>图片</div>
                <div style={{ paddingLeft: 8 }}>URL</div>
                <div style={{ paddingLeft: 8 }}>标签（逗号分隔）</div>
                <div style={{ textAlign: 'center' }}>操作</div>
                <div />
              </div>

              {/* 行 */}
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#bbb', fontSize: 13 }}>暂无数据，点击「添加」新增</div>
              ) : items.map((item, idx) => (
                <div
                  key={item._key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 50px 80px 80px 1fr 140px 100px 80px',
                    alignItems: 'center',
                    borderBottom: idx < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                    padding: '6px 0',
                    background: '#fff',
                  }}
                >
                  {/* 拖拽手柄 */}
                  <div style={{ textAlign: 'center', color: '#ccc', cursor: 'grab' }}>
                    <HolderOutlined />
                  </div>

                  {/* 序号 */}
                  <div style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>{idx + 1}</div>

                  {/* 类型切换 */}
                  <div style={{ textAlign: 'center' }}>
                    <Space size={2}>
                      <Tag
                        color={item.item_type === 'image' ? 'blue' : 'default'}
                        style={{ cursor: 'pointer', marginRight: 0 }}
                        onClick={() => updateItem(item._key, 'item_type', 'image')}
                      >图片</Tag>
                      <Tag
                        color={item.item_type === 'url' ? 'blue' : 'default'}
                        style={{ cursor: 'pointer', marginRight: 0 }}
                        onClick={() => updateItem(item._key, 'item_type', 'url')}
                      >URL</Tag>
                    </Space>
                  </div>

                  {/* 缩略图（仅 image 类型显示） */}
                  <div style={{ textAlign: 'center' }}>
                    {item.item_type === 'image' && item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    ) : item.item_type === 'image' ? (
                      <div style={{ width: 48, height: 48, background: '#f5f5f5', borderRadius: 4, display: 'inline-block', border: '1px solid #f0f0f0' }} />
                    ) : null}
                  </div>

                  {/* URL 输入框 */}
                  <div style={{ paddingRight: 8, paddingLeft: 8 }}>
                    <Input
                      size="small"
                      placeholder={item.item_type === 'image' ? 'image_url' : 'link_url'}
                      value={item.item_type === 'image' ? item.image_url : item.link_url}
                      onChange={e => updateItem(item._key, item.item_type === 'image' ? 'image_url' : 'link_url', e.target.value)}
                    />
                  </div>

                  {/* 标签 */}
                  <div style={{ paddingRight: 8 }}>
                    <Input
                      size="small"
                      placeholder="标签，逗号分隔"
                      value={item.tags}
                      onChange={e => updateItem(item._key, 'tags', e.target.value)}
                    />
                  </div>

                  {/* 操作 */}
                  <div style={{ textAlign: 'center' }}>
                    <Space size={4}>
                      {item.item_type === 'image' && (
                        <Upload
                          showUploadList={false}
                          accept="image/*"
                          beforeUpload={file => handleUploadImage(file, item._key)}
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<UploadOutlined />}
                            loading={uploadingRowKey === item._key}
                            style={{ color: '#1677ff' }}
                          />
                        </Upload>
                      )}
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(item._key)}
                      />
                    </Space>
                  </div>

                  <div />
                </div>
              ))}
            </div>

            {/* 底部添加按钮 */}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addItem}
              style={{ width: '100%', marginTop: 8 }}
            >
              添加
            </Button>
          </Form.Item>
        </Form>
      </div>
    )
  }

  // ================================================================
  // 列表视图
  // ================================================================
  return (
    <div style={{ padding: 24 }}>
      {/* 标题 + 操作 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>图片管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建图片组</Button>
      </div>

      {/* 筛选栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="ID / 名称搜索"
          allowClear
          style={{ width: 200 }}
          onSearch={v => { setFilterKeyword(v); setPage(1) }}
          onChange={e => { if (!e.target.value) { setFilterKeyword(''); setPage(1) } }}
        />
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          value={filterStatus || undefined}
          onChange={v => { setFilterStatus(v || ''); setPage(1) }}
        >
          <Option value="enabled">启用</Option>
          <Option value="disabled">停用</Option>
        </Select>
        <Select
          placeholder="创建人"
          allowClear
          style={{ width: 140 }}
          value={filterCreator || undefined}
          onChange={v => setFilterCreator(v || '')}
        >
          {creatorOptions.map(c => <Option key={c} value={c}>{c}</Option>)}
        </Select>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1300 }}
      />

      {/* 分页 */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showTotal={t => `共 ${t} 条`}
          onChange={p => setPage(p)}
          showSizeChanger={false}
        />
      </div>
    </div>
  )
}

export default ImageAssetList
