import { useState, useEffect, useMemo } from 'react'
import { Drawer, Input, Button, Space, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const LANGUAGES = [
  { code: 'en', label: '英文', required: true },
  { code: 'zh-CN', label: '简中' },
  { code: 'es', label: '西语' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'pt', label: '葡语' },
  { code: 'ru', label: '俄语' },
  { code: 'ar', label: '阿语' },
]

function MultiLangDrawer({ open, onClose, value = [], onChange, enTitle = '', enContent = '' }) {
  const [draft, setDraft] = useState([])
  const [search, setSearch] = useState('')

  // Sync draft from value when drawer opens; English row always mirrors external input
  useEffect(() => {
    if (open) {
      const map = new Map(value.map(v => [v.lang, v]))
      setDraft(LANGUAGES.map(l => ({
        lang: l.code,
        title: l.code === 'en' ? enTitle : (map.get(l.code)?.title || ''),
        content: l.code === 'en' ? enContent : (map.get(l.code)?.content || ''),
      })))
      setSearch('')
    }
  }, [open, value, enTitle, enContent])

  const filtered = useMemo(() => {
    if (!search) return LANGUAGES
    const q = search.toLowerCase()
    return LANGUAGES.filter(l => {
      const row = draft.find(d => d.lang === l.code)
      return (
        l.label.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (row?.title || '').toLowerCase().includes(q) ||
        (row?.content || '').toLowerCase().includes(q)
      )
    })
  }, [search, draft])

  const updateField = (lang, field, val) => {
    setDraft(prev => prev.map(d => (d.lang === lang ? { ...d, [field]: val } : d)))
  }

  const handleConfirm = () => {
    const filled = draft.filter(d => d.title || d.content)
    onChange(filled)
    onClose()
  }

  const handleUpload = (file) => {
    // Placeholder: parse uploaded translation file
    message.info('上传翻译功能开发中')
    return false
  }

  const handleAutoTranslate = () => {
    message.info('一键翻译功能开发中')
  }

  return (
    <Drawer
      title="多语言设置"
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleConfirm}>确定</Button>
          </Space>
        </div>
      }
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Input
          placeholder="搜索通知标题/内容"
          style={{ width: 220 }}
          allowClear
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Space>
          <Upload beforeUpload={handleUpload} showUploadList={false} accept=".xlsx,.xls,.csv">
            <Button icon={<UploadOutlined />} type="link">上传翻译</Button>
          </Upload>
          <Button type="primary" onClick={handleAutoTranslate}>一键翻译</Button>
        </Space>
      </div>

      {/* Table header */}
      <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f0f0f0', color: '#8c8c8c', fontSize: 13 }}>
        <div style={{ width: 60 }}>语言</div>
        <div style={{ flex: 1 }}>通知标题</div>
        <div style={{ flex: 1 }}>通知内容</div>
      </div>

      {/* Rows */}
      {filtered.map(lang => {
        const row = draft.find(d => d.lang === lang.code) || { title: '', content: '' }
        return (
          <div key={lang.code} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ width: 60, fontSize: 14 }}>
              {lang.required && <span style={{ color: '#ff4d4f' }}>*</span>}
              {lang.label}
            </div>
            <Input
              style={{ flex: 1 }}
              placeholder={`${lang.label}标题`}
              value={row.title}
              disabled={lang.code === 'en'}
              onChange={e => updateField(lang.code, 'title', e.target.value)}
            />
            <Input
              style={{ flex: 1 }}
              placeholder={`${lang.label}内容`}
              value={row.content}
              disabled={lang.code === 'en'}
              onChange={e => updateField(lang.code, 'content', e.target.value)}
            />
          </div>
        )
      })}
    </Drawer>
  )
}

export default MultiLangDrawer
