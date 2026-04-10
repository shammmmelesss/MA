import { useRef, useState, useEffect } from 'react'
import { Radio, Select, Input, Button, Upload, Popover, Space, Typography, Tooltip, message } from 'antd'
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { getTemplates } from '../api'
import PreviewCard from './PreviewCard'
import MultiLangDrawer from './MultiLangDrawer'

const { Text } = Typography

const PARAMS = [
  { label: '用户名', value: '{{username}}' },
  { label: '设备型号', value: '{{device}}' },
  { label: '国家', value: '{{country}}' },
  { label: '语言', value: '{{language}}' },
]

const EXPAND_OPTIONS = [
  { label: '禁用', value: 'disabled' },
  { label: '文本', value: 'text' },
  { label: '大图', value: 'large_image' },
  { label: '背景图', value: 'bg_image' },
  { label: '背景色值', value: 'bg_color' },
  { label: '右侧大图', value: 'right_image' },
]

const SOUND_ENABLE_OPTIONS = [
  { label: '停用', value: 'disabled' },
  { label: '启用', value: 'enabled' },
]

const SOUND_LIST_OPTIONS = [
  { label: '提示音1', value: 'sound_1' },
  { label: '提示音2', value: 'sound_2' },
]

function InsertParamButton({ inputRef, onInsert }) {
  const handleSelect = (param) => {
    const el = inputRef.current?.input || inputRef.current?.resizableTextArea?.textArea
    if (!el) { onInsert(param); return }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const before = el.value.slice(0, start)
    const after = el.value.slice(end)
    onInsert(before + param + after, start + param.length)
    setTimeout(() => { el.focus(); el.setSelectionRange(start + param.length, start + param.length) }, 0)
  }
  return (
    <Popover trigger="click" content={
      <Space direction="vertical" size={4}>
        {PARAMS.map(p => (
          <Button key={p.value} type="text" size="small" onClick={() => handleSelect(p.value)}>{p.label}</Button>
        ))}
      </Space>
    }>
      <Button type="link" size="small" icon={<PlusOutlined />}>参数</Button>
    </Popover>
  )
}

/* ── Main form ── */
function PushConfigForm() {
  const { state, updatePushConfig, updatePushState } = useTaskFormContext()
  const [templates, setTemplates] = useState([])
  const [touched, setTouched] = useState({ clickLink: false })
  const titleRef = useRef(null)
  const contentRef = useRef(null)
  const [fieldTouched, setFieldTouched] = useState({})
  const [langDrawerOpen, setLangDrawerOpen] = useState(false)
  const handleFieldBlur = (f) => setFieldTouched(prev => ({ ...prev, [f]: true }))

  const clickLinkError = touched.clickLink && state.clickAction === 'open_link' && !state.clickLink

  useEffect(() => {
    getTemplates().then(data => {
      const list = data?.templates || (Array.isArray(data) ? data : [])
      setTemplates(list)
    }).catch(() => message.error('获取模板列表失败'))
  }, [])

  const ps = state.pushStates[0] || {}
  const isTemplate = ps.contentFillMode === 'template'
  const titleError = !isTemplate && fieldTouched.notificationTitle && !ps.notificationTitle
  const contentError = !isTemplate && fieldTouched.notificationContent && !ps.notificationContent

  const handleImageUpload = (file) => {
    const ok = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!ok) { message.error('仅支持 jpg/png 格式'); return Upload.LIST_IGNORE }
    if (file.size > 300 * 1024) { message.error('图片大小不能超过 300KB'); return Upload.LIST_IGNORE }
    const url = URL.createObjectURL(file)
    updatePushState(ps.id, 'notificationImage', { type: 'custom', url })
    return false
  }

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 400, maxWidth: 700 }}>
        {/* 实验类型 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>实验类型</label>
          <div style={{ marginTop: 10 }}>
            <Radio.Group value={state.experimentType} onChange={e => updatePushConfig('experimentType', e.target.value)}>
              <Radio value="none">非AB实验</Radio>
              <Radio value="ab_planned" disabled>AB实验（规划）</Radio>
            </Radio.Group>
          </div>
        </div>

        {/* 内容填充 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>内容填充</label>
          <div style={{ marginTop: 10 }}>
            <Radio.Group value={ps.contentFillMode} onChange={e => updatePushState(ps.id, 'contentFillMode', e.target.value)}>
              <Radio value="custom">自定义</Radio>
              <Radio value="template">内容模板</Radio>
            </Radio.Group>
            {ps.contentFillMode === 'template' && (
              <span style={{ display: 'inline-flex', gap: 8, marginLeft: 16 }}>
                <Select style={{ width: 160 }} placeholder="选择文案组" value={ps.copywritingGroup || undefined}
                  onChange={v => updatePushState(ps.id, 'copywritingGroup', v)}
                  options={templates.map(t => ({ label: t.name || t, value: t.id || t }))} allowClear />
                <Select style={{ width: 160 }} placeholder="选择发送规则" value={ps.sendRule || undefined}
                  onChange={v => updatePushState(ps.id, 'sendRule', v)}
                  options={[
                    { label: '顺序发送', value: 'sequential' },
                    { label: '随机发送', value: 'random' },
                    { label: '智能优选', value: 'smart' },
                  ]} allowClear />
              </span>
            )}
          </div>
        </div>

        {/* 通知标题 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#ff4d4f' }}>*</span>
              <Text style={{ fontSize: 14 }}>通知标题</Text>
              <InsertParamButton inputRef={titleRef} onInsert={(val) => updatePushState(ps.id, 'notificationTitle', val)} />
            </div>
            <Button type="link" size="small" onClick={() => setLangDrawerOpen(true)}>多语言</Button>
          </div>
          <Input ref={titleRef} placeholder="请输入通知标题" maxLength={50} showCount disabled={isTemplate}
            value={ps.notificationTitle} onChange={e => updatePushState(ps.id, 'notificationTitle', e.target.value)}
            onBlur={() => handleFieldBlur('notificationTitle')} status={titleError ? 'error' : undefined} />
          {titleError && <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}>请输入通知标题</div>}
        </div>

        {/* 通知内容 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <span style={{ color: '#ff4d4f' }}>*</span>
            <Text style={{ fontSize: 14 }}>通知内容</Text>
            <InsertParamButton inputRef={contentRef} onInsert={(val) => updatePushState(ps.id, 'notificationContent', val)} />
          </div>
          <Input.TextArea ref={contentRef} rows={4} placeholder="请输入通知内容" maxLength={200} showCount disabled={isTemplate}
            value={ps.notificationContent} onChange={e => updatePushState(ps.id, 'notificationContent', e.target.value)}
            onBlur={() => handleFieldBlur('notificationContent')} status={contentError ? 'error' : undefined} />
          {contentError && <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}>请输入通知内容</div>}
        </div>

        {/* 通知图片 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Text style={{ fontSize: 14 }}>通知图片</Text>
            <Tooltip title="尺寸:95x95, 不超过300k"><InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} /></Tooltip>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Select style={{ width: 120 }} value={ps.notificationImage.type} disabled={isTemplate}
              onChange={v => {
                const img = { type: v, url: '', material: '' }
                updatePushState(ps.id, 'notificationImage', img)
              }}
              options={[
                { label: '自定义', value: 'custom' },
                { label: '图片随材', value: 'material' },
                { label: '无', value: 'none' },
              ]} />

            {/* 自定义模式 */}
            {ps.notificationImage.type === 'custom' && (
              ps.notificationImage.url ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Upload beforeUpload={handleImageUpload} showUploadList={false} accept=".jpg,.jpeg,.png">
                    <Button type="link" size="small">上传图片</Button>
                  </Upload>
                  <Text style={{ maxWidth: 280, fontSize: 13, color: '#8c8c8c' }} ellipsis>{ps.notificationImage.url}</Text>
                  <Button type="text" size="small" icon={<DeleteOutlined />}
                    onClick={() => updatePushState(ps.id, 'notificationImage', { ...ps.notificationImage, url: '' })} />
                </span>
              ) : (
                <Upload beforeUpload={handleImageUpload} showUploadList={false} accept=".jpg,.jpeg,.png">
                  <Button type="link" size="small">上传图片</Button>
                </Upload>
              )
            )}

            {/* 图片随材模式 */}
            {ps.notificationImage.type === 'material' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Select style={{ width: 160 }} placeholder="选择图片随材"
                  value={ps.notificationImage.material || undefined}
                  onChange={v => updatePushState(ps.id, 'notificationImage', { ...ps.notificationImage, material: v, url: v })}
                  options={[
                    { label: '图片随材1', value: 'material_1' },
                    { label: '图片随材2', value: 'material_2' },
                    { label: '图片随材3', value: 'material_3' },
                  ]} allowClear />
                {ps.notificationImage.url && (
                  <Text style={{ maxWidth: 280, fontSize: 13, color: '#8c8c8c' }} ellipsis>{ps.notificationImage.url}</Text>
                )}
              </span>
            )}

            {/* 无模式：不显示额外内容 */}
          </div>
        </div>

        {/* 点击跳转 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>点击跳转</label>
          <div style={{ marginTop: 10 }}>
            <Radio.Group value={state.clickAction} onChange={e => updatePushConfig('clickAction', e.target.value)}>
              <Radio value="open_app">打开应用</Radio>
              <Radio value="open_link">打开特定链接</Radio>
            </Radio.Group>
            {state.clickAction === 'open_link' && (
              <div style={{ marginTop: 10 }}>
                <Input style={{ maxWidth: 400 }} placeholder="请输入跳转链接"
                  value={state.clickLink} onChange={e => updatePushConfig('clickLink', e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, clickLink: true }))}
                  status={clickLinkError ? 'error' : undefined} />
                {clickLinkError && <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 6 }}>请输入跳转链接</div>}
              </div>
            )}
          </div>
        </div>

        {/* 基础样式 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>基础样式</label>
          <div style={{ marginTop: 10 }}>
            <Radio.Group value={state.style.basic} onChange={e => updatePushConfig('style.basic', e.target.value)}>
              <Radio value="normal">普通弹窗</Radio>
              <Radio value="floating">类悬浮弹窗</Radio>
            </Radio.Group>
          </div>
        </div>

        {/* 展开式通知 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>展开式通知</label>
          <div style={{ marginTop: 10 }}>
            <Radio.Group value={state.style.expandType} onChange={e => updatePushConfig('style.expandType', e.target.value)}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
              {EXPAND_OPTIONS.map(o => <Radio key={o.value} value={o.value}>{o.label}</Radio>)}
            </Radio.Group>
          </div>
        </div>

        {/* 提示音 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>提示音</label>
          <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
            <Select style={{ width: 120 }}
              value={state.style.sound ? 'enabled' : 'disabled'}
              onChange={v => updatePushConfig('style.sound', v === 'enabled' ? 'sound_1' : '')}
              options={SOUND_ENABLE_OPTIONS} />
            {state.style.sound && (
              <Select style={{ width: 160 }} placeholder="选择提示音"
                value={state.style.sound}
                onChange={v => updatePushConfig('style.sound', v)}
                options={SOUND_LIST_OPTIONS} />
            )}
          </div>
        </div>

        {/* 是否震动 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>是否震动</label>
          <div style={{ marginTop: 10 }}>
            <Radio.Group value={state.style.vibrate} onChange={e => updatePushConfig('style.vibrate', e.target.value)}>
              <Radio value={false}>否</Radio>
              <Radio value={true}>是</Radio>
            </Radio.Group>
          </div>
        </div>
      </div>

      {/* 多语言设置抽屉 */}
      <MultiLangDrawer
        open={langDrawerOpen}
        onClose={() => setLangDrawerOpen(false)}
        value={ps.i18nTexts || []}
        onChange={(texts) => updatePushState(ps.id, 'i18nTexts', texts)}
        enTitle={ps.notificationTitle}
        enContent={ps.notificationContent}
      />

      {/* 实时预览 */}
      <PreviewCard
        title={ps.notificationTitle}
        content={ps.notificationContent}
        imageUrl={ps.notificationImage?.url}
        style={state.style}
      />
    </div>
  )
}

export default PushConfigForm
