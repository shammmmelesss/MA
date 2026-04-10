import React, { useState, useEffect } from 'react'
import { Button, Input, Select, Space, Table, message, Modal, Upload, Tooltip } from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  TranslationOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import MultiLangDrawer from '../Task/Create/components/MultiLangDrawer.jsx'

const { Option } = Select

// 生成文案ID（模拟长数字ID）
const generateCopyId = () => {
  return Date.now().toString() + Math.floor(Math.random() * 1000000).toString()
}

const ContentTemplateEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [groupName, setGroupName] = useState('')
  const [copies, setCopies] = useState([
    { key: generateCopyId(), copy_id: generateCopyId(), title: '', content: '', image: undefined, translations: [] },
    { key: generateCopyId(), copy_id: generateCopyId(), title: '', content: '', image: undefined, translations: [] },
  ])
  const [saving, setSaving] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewRecord, setPreviewRecord] = useState(null)
  const [langDrawerOpen, setLangDrawerOpen] = useState(false)
  const [langEditingKey, setLangEditingKey] = useState(null)

  // 编辑模式下加载数据
  useEffect(() => {
    if (isEdit) {
      fetchDetail()
    }
  }, [id])

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`/api/v1/content-templates/${id}`)
      const data = res.data
      setGroupName(data.name || '')
      if (data.copies && data.copies.length) {
        setCopies(data.copies.map((c) => ({ ...c, key: c.copy_id || generateCopyId() })))
      }
    } catch {
      message.error('获取文案组详情失败')
    }
  }

  // 添加文案行
  const handleAddCopy = () => {
    const newId = generateCopyId()
    setCopies([...copies, { key: newId, copy_id: newId, title: '', content: '', image: undefined, translations: [] }])
  }

  // 更新某行字段
  const updateCopy = (key, field, value) => {
    setCopies(copies.map((c) => (c.key === key ? { ...c, [field]: value } : c)))
  }

  // 复制某行
  const handleCopyRow = (record) => {
    const newId = generateCopyId()
    const newRow = { ...record, key: newId, copy_id: newId }
    setCopies([...copies, newRow])
  }

  // 删除某行
  const handleDeleteRow = (key) => {
    if (copies.length <= 1) {
      message.warning('至少保留一条文案')
      return
    }
    setCopies(copies.filter((c) => c.key !== key))
  }

  // 预览
  const handlePreview = (record) => {
    setPreviewRecord(record)
    setPreviewVisible(true)
  }

  // 多语言设置
  const handleOpenLang = (record) => {
    setLangEditingKey(record.key)
    setLangDrawerOpen(true)
  }

  const handleLangChange = (langData) => {
    setCopies(copies.map((c) => (c.key === langEditingKey ? { ...c, translations: langData } : c)))
  }

  const langEditingRecord = copies.find((c) => c.key === langEditingKey)

  // 上传文案（解析 Excel/CSV 批量导入）
  const handleUploadCopy = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter((l) => l.trim())
        // 跳过表头，每行格式：标题,内容
        const newCopies = lines.slice(1).map((line) => {
          const [title = '', content = ''] = line.split(',').map((s) => s.trim())
          const newId = generateCopyId()
          return { key: newId, copy_id: newId, title, content, image: undefined, translations: [] }
        })
        if (newCopies.length) {
          setCopies((prev) => [...prev, ...newCopies])
          message.success(`成功导入 ${newCopies.length} 条文案`)
        } else {
          message.warning('未解析到有效文案数据')
        }
      } catch {
        message.error('文件解析失败，请检查格式')
      }
    }
    reader.readAsText(file)
    return false // 阻止默认上传
  }

  // 保存
  const handleSave = async () => {
    if (!groupName.trim()) {
      message.warning('请输入文案组名称')
      return
    }
    const hasEmpty = copies.some((c) => !c.title.trim() && !c.content.trim())
    if (hasEmpty) {
      message.warning('请填写文案标题或内容')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: groupName,
        copies: copies.map(({ copy_id, title, content, image, translations }) => ({
          copy_id,
          title,
          content,
          image: image || null,
          translations: translations || [],
        })),
      }
      if (isEdit) {
        await axios.put(`/api/v1/content-templates/${id}`, payload)
        message.success('保存成功')
      } else {
        await axios.post('/api/v1/content-templates', payload)
        message.success('创建成功')
      }
      navigate('/channels/config')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 图片选项
  const imageOptions = [
    { value: undefined, label: '无' },
    { value: 'image_1', label: '图片1' },
    { value: 'image_2', label: '图片2' },
    { value: 'image_3', label: '图片3' },
  ]

  const columns = [
    {
      title: '文案ID',
      dataIndex: 'copy_id',
      key: 'copy_id',
      width: 180,
      render: (text) => <span style={{ fontSize: 12, color: '#666' }}>{text}</span>,
    },
    {
      title: '通知标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (_, record) => (
        <div>
          <Input.TextArea
            placeholder="请输入"
            maxLength={50}
            autoSize={{ minRows: 2, maxRows: 3 }}
            value={record.title}
            onChange={(e) => updateCopy(record.key, 'title', e.target.value)}
          />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
            {(record.title || '').length}/50
          </div>
        </div>
      ),
    },
    {
      title: '通知内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (_, record) => (
        <div>
          <Input.TextArea
            placeholder="请输入"
            maxLength={200}
            autoSize={{ minRows: 2, maxRows: 4 }}
            value={record.content}
            onChange={(e) => updateCopy(record.key, 'content', e.target.value)}
          />
          <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
            {(record.content || '').length}/200
          </div>
        </div>
      ),
    },
    {
      title: '通知图片',
      dataIndex: 'image',
      key: 'image',
      width: 140,
      render: (_, record) => (
        <Select
          style={{ width: 120 }}
          value={record.image}
          onChange={(v) => updateCopy(record.key, 'image', v)}
          placeholder="无"
          allowClear
        >
          {imageOptions.map((opt) => (
            <Option key={opt.value || 'none'} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<TranslationOutlined />} onClick={() => handleOpenLang(record)} title="多语言设置" />
          <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopyRow(record)} title="复制" />
          {copies.length > 1 && (
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRow(record.key)} title="删除" />
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      {/* 顶部栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/channels/config')} />
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {isEdit ? '编辑文案组' : '新建文案组'}
          </span>
        </div>
        <Space>
          <Button onClick={() => navigate('/channels/config')}>取消</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      </div>

      {/* 内容区 */}
      <div style={{ padding: '24px 32px', maxWidth: 1200 }}>
        {/* 文案组名称 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ marginRight: 8, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'red' }}>*</span> 文案组名称
          </span>
          <Input
            placeholder="请输入"
            style={{ width: 240 }}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {/* 文案内容 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ marginRight: 8, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'red' }}>*</span> 文案内容
          </span>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddCopy}>
            添加文案
          </Button>
          <Tooltip
            title={
              <div>
                <div>1、每次上传为追加模式，原有文案保留，追加新文案；</div>
                <div>2、仅支持csv格式，点击下载模板 <a href="/template/copy_template.csv" download style={{ color: '#1890ff' }}>模板链接</a></div>
              </div>
            }
          >
            <Upload beforeUpload={handleUploadCopy} showUploadList={false} accept=".csv">
              <Button type="link" icon={<UploadOutlined />}>上传文案</Button>
            </Upload>
          </Tooltip>
        </div>

        <Table
          columns={columns}
          dataSource={copies}
          rowKey="key"
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* 预览弹窗 */}
      <Modal
        title="文案预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={400}
      >
        {previewRecord && (
          <div>
            <p><span style={{ color: '#999' }}>标题：</span>{previewRecord.title || '（空）'}</p>
            <p><span style={{ color: '#999' }}>内容：</span>{previewRecord.content || '（空）'}</p>
            <p><span style={{ color: '#999' }}>图片：</span>{previewRecord.image || '无'}</p>
          </div>
        )}
      </Modal>

      {/* 多语言设置 */}
      <MultiLangDrawer
        open={langDrawerOpen}
        onClose={() => setLangDrawerOpen(false)}
        value={langEditingRecord?.translations || []}
        onChange={handleLangChange}
        enTitle={langEditingRecord?.title || ''}
        enContent={langEditingRecord?.content || ''}
      />
    </div>
  )
}

export default ContentTemplateEdit
