import { useRef, useState, useEffect, useContext } from 'react'
import { Radio, Select, Input, InputNumber, Button, Upload, Popover, Space, Typography, Tooltip, Checkbox, message } from 'antd'
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { getTemplates, getImageGroups } from '../api'
import { ProjectContext } from '../../../../App.jsx'
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

/* ── 单个模式下的内容配置（内容填充 / 标题 / 内容 / 图片） ── */
function ContentFields({ mode, templates }) {
  const { state, updatePushStateByMode } = useTaskFormContext()
  const titleRef = useRef(null)
  const contentRef = useRef(null)
  const [fieldTouched, setFieldTouched] = useState({})
  const [langDrawerOpen, setLangDrawerOpen] = useState(false)
  const handleFieldBlur = (f) => setFieldTouched(prev => ({ ...prev, [f]: true }))

  const ps = state.pushStates[0] || {}
  const md = mode === 'dark' ? (ps.dark || {}) : ps
  const setField = (field, val) => updatePushStateByMode(ps.id, mode, field, val)
  const isTemplate = md.contentFillMode === 'template'
  const titleError = !isTemplate && fieldTouched.notificationTitle && !md.notificationTitle
  const contentError = !isTemplate && fieldTouched.notificationContent && !md.notificationContent

  const handleImageUpload = (file) => {
    const ok = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!ok) { message.error('仅支持 jpg/png 格式'); return Upload.LIST_IGNORE }
    if (file.size > 300 * 1024) { message.error('图片大小不能超过 300KB'); return Upload.LIST_IGNORE }
    const url = URL.createObjectURL(file)
    setField('notificationImage', { type: 'custom', url })
    return false
  }

  return (
    <>
      {/* 内容填充 */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 14, color: '#262626' }}>内容填充</label>
        <div style={{ marginTop: 10 }}>
          <Radio.Group value={md.contentFillMode} onChange={e => setField('contentFillMode', e.target.value)}>
            <Radio value="custom">自定义</Radio>
            <Radio value="template">内容模板</Radio>
          </Radio.Group>
          {md.contentFillMode === 'template' && (
            <span style={{ display: 'inline-flex', gap: 8, marginLeft: 16 }}>
              <Select style={{ width: 160 }} placeholder="选择文案组" value={md.copywritingGroup || undefined}
                onChange={v => setField('copywritingGroup', v)}
                options={templates.map(t => ({ label: t.name || t, value: t.id || t }))} allowClear />
              <Select style={{ width: 160 }} placeholder="选择发送规则" value={md.sendRule || undefined}
                onChange={v => setField('sendRule', v)}
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
            <InsertParamButton inputRef={titleRef} onInsert={(val) => setField('notificationTitle', val)} />
          </div>
          <Button type="link" size="small" onClick={() => setLangDrawerOpen(true)}>多语言</Button>
        </div>
        <Input ref={titleRef} placeholder="请输入通知标题" maxLength={50} showCount disabled={isTemplate}
          value={md.notificationTitle} onChange={e => setField('notificationTitle', e.target.value)}
          onBlur={() => handleFieldBlur('notificationTitle')} status={titleError ? 'error' : undefined} />
        {titleError && <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 4 }}>请输入通知标题</div>}
      </div>

      {/* 通知内容 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <span style={{ color: '#ff4d4f' }}>*</span>
          <Text style={{ fontSize: 14 }}>通知内容</Text>
          <InsertParamButton inputRef={contentRef} onInsert={(val) => setField('notificationContent', val)} />
        </div>
        <Input.TextArea ref={contentRef} rows={4} placeholder="请输入通知内容" maxLength={200} showCount disabled={isTemplate}
          value={md.notificationContent} onChange={e => setField('notificationContent', e.target.value)}
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
          <Select style={{ width: 120 }} value={md.notificationImage?.type} disabled={isTemplate}
            onChange={v => setField('notificationImage', { type: v, url: '', material: '' })}
            options={[
              { label: '自定义', value: 'custom' },
              { label: '列表随机', value: 'material' },
              { label: '无', value: 'none' },
            ]} />

          {/* 自定义模式 */}
          {md.notificationImage?.type === 'custom' && (
            md.notificationImage.url ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Upload beforeUpload={handleImageUpload} showUploadList={false} accept=".jpg,.jpeg,.png">
                  <Button type="link" size="small">上传图片</Button>
                </Upload>
                <Text style={{ maxWidth: 280, fontSize: 13, color: '#8c8c8c' }} ellipsis>{md.notificationImage.url}</Text>
                <Button type="text" size="small" icon={<DeleteOutlined />}
                  onClick={() => setField('notificationImage', { ...md.notificationImage, url: '' })} />
              </span>
            ) : (
              <Upload beforeUpload={handleImageUpload} showUploadList={false} accept=".jpg,.jpeg,.png">
                <Button type="link" size="small">上传图片</Button>
              </Upload>
            )
          )}

          {/* 图片随材模式 */}
          {md.notificationImage?.type === 'material' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Select style={{ width: 160 }} placeholder="选择图片随材"
                value={md.notificationImage.material || undefined}
                onChange={v => setField('notificationImage', { ...md.notificationImage, material: v, url: v })}
                options={[
                  { label: '图片随材1', value: 'material_1' },
                  { label: '图片随材2', value: 'material_2' },
                  { label: '图片随材3', value: 'material_3' },
                ]} allowClear />
              {md.notificationImage.url && (
                <Text style={{ maxWidth: 280, fontSize: 13, color: '#8c8c8c' }} ellipsis>{md.notificationImage.url}</Text>
              )}
            </span>
          )}
        </div>
      </div>

      {/* 多语言设置抽屉 */}
      <MultiLangDrawer
        open={langDrawerOpen}
        onClose={() => setLangDrawerOpen(false)}
        value={md.i18nTexts || []}
        onChange={(texts) => setField('i18nTexts', texts)}
        enTitle={md.notificationTitle}
        enContent={md.notificationContent}
      />
    </>
  )
}

/* ── Main form ── */
function PushConfigForm() {
  const { state, updatePushConfig } = useTaskFormContext()
  const { currentProject } = useContext(ProjectContext) || {}
  const [templates, setTemplates] = useState([])
  const [imageGroups, setImageGroups] = useState([])
  const [touched, setTouched] = useState({ clickLink: false })

  const darkEnabled = state.darkModeEnabled
  const [previewMode, setPreviewMode] = useState('light')
  const clickLinkError = touched.clickLink && state.clickAction === 'open_link' && !state.clickLink

  useEffect(() => {
    getTemplates().then(data => {
      const list = data?.templates || (Array.isArray(data) ? data : [])
      setTemplates(list)
    }).catch(() => message.error('获取模板列表失败'))
  }, [])

  useEffect(() => {
    if (!currentProject?.project_id) return
    getImageGroups(currentProject.project_id, 'large')
      .then(data => setImageGroups(data?.list || []))
      .catch(() => setImageGroups([]))
  }, [currentProject])

  const ps = state.pushStates[0] || {}

  const handleExpandImageUpload = (file) => {
    const ok = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!ok) { message.error('仅支持 jpg/png 格式'); return Upload.LIST_IGNORE }
    if (file.size > 1024 * 1024) { message.error('图片大小不能超过 1MB'); return Upload.LIST_IGNORE }
    const url = URL.createObjectURL(file)
    updatePushConfig('style.expandImageUrl', url)
    return false
  }

  const sectionCardStyle = {
    border: '1px solid #f0f0f0',
    borderRadius: 8,
    padding: '16px 16px 0',
    marginBottom: 24,
  }

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 400, maxWidth: 700 }}>
        {/* 实验类型 */}
        <div style={{ marginBottom: 24 }}>
          <Radio.Group optionType="button" buttonStyle="outline"
            value={state.experimentType} onChange={e => updatePushConfig('experimentType', e.target.value)}>
            <Radio.Button value="none">非AB实验</Radio.Button>
            <Radio.Button value="ab_planned" disabled>AB实验（规划）</Radio.Button>
          </Radio.Group>
        </div>

        {/* 明暗模式选择 */}
        <div style={{ marginBottom: 24 }}>
          <Checkbox checked disabled>浅色模式</Checkbox>
          <Checkbox
            checked={darkEnabled}
            onChange={e => updatePushConfig('darkModeEnabled', e.target.checked)}
            style={{ marginLeft: 16 }}
          >深色模式</Checkbox>
        </div>

        {/* 浅色模式内容配置 */}
        <div style={sectionCardStyle}>
          {darkEnabled && (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 16 }}>浅色模式</div>
          )}
          <ContentFields mode="light" templates={templates} />
        </div>

        {/* 深色模式内容配置（勾选后展示） */}
        {darkEnabled && (
          <div style={{ ...sectionCardStyle, background: '#fafafa' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 16 }}>深色模式</div>
            <ContentFields mode="dark" templates={templates} />
          </div>
        )}

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
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Select
              value={state.style.expandType}
              onChange={val => {
                updatePushConfig('style.expandType', val)
                updatePushConfig('style.expandImageMode', undefined)
                updatePushConfig('style.expandImageUrl', undefined)
                updatePushConfig('style.expandImageGroupId', undefined)
                updatePushConfig('style.expandImageOffset', undefined)
              }}
              style={{ width: 160 }}
              options={EXPAND_OPTIONS}
            />
            {state.style.expandType === 'large_image' && (
              <Select
                value={state.style.expandImageMode || 'random'}
                onChange={val => {
                  updatePushConfig('style.expandImageMode', val)
                  updatePushConfig('style.expandImageUrl', undefined)
                  updatePushConfig('style.expandImageGroupId', undefined)
                  updatePushConfig('style.expandImageOffset', undefined)
                }}
                style={{ width: 160 }}
                options={[
                  { label: '列表随机', value: 'random' },
                  { label: '顺序发送', value: 'date_map' },
                  { label: '自定义', value: 'custom' },
                ]}
              />
            )}
            {state.style.expandType === 'large_image' &&
              (state.style.expandImageMode === 'random' || state.style.expandImageMode === 'date_map') && (
              <Select
                value={state.style.expandImageGroupId}
                onChange={val => updatePushConfig('style.expandImageGroupId', val)}
                style={{ width: 200 }}
                placeholder="选择图片组"
                options={imageGroups.map(g => ({ label: g.name, value: g.id }))}
                notFoundContent="暂无图片组"
              />
            )}
            {state.style.expandType === 'large_image' && state.style.expandImageMode === 'date_map' && (
              <Space size={4}>
                <Tooltip title="从图片组的第几张开始顺序发送">
                  <span style={{ fontSize: 14, color: '#595959' }}>偏移量</span>
                </Tooltip>
                <InputNumber
                  min={0}
                  step={1}
                  precision={0}
                  value={state.style.expandImageOffset ?? 0}
                  onChange={val => updatePushConfig('style.expandImageOffset', val ?? 0)}
                  style={{ width: 100 }}
                />
              </Space>
            )}
            {state.style.expandType === 'large_image' && state.style.expandImageMode === 'custom' && (
              <Upload
                beforeUpload={handleExpandImageUpload}
                showUploadList={false}
                accept=".jpg,.jpeg,.png"
              >
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>
                  {state.style.expandImageUrl ? '重新上传' : '上传图片'}
                </Button>
              </Upload>
            )}
            {state.style.expandType === 'large_image' && state.style.expandImageMode === 'custom' && state.style.expandImageUrl && (
              <img src={state.style.expandImageUrl} alt="大图预览" style={{ height: 32, borderRadius: 4, border: '1px solid #d9d9d9' }} />
            )}
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

      {/* 实时预览 */}
      {(() => {
        const effMode = darkEnabled && previewMode === 'dark' ? 'dark' : 'light'
        const pm = effMode === 'dark' ? (ps.dark || {}) : ps
        return (
          <PreviewCard
            title={pm.notificationTitle}
            content={pm.notificationContent}
            imageUrl={pm.notificationImage?.url}
            style={state.style}
            previewMode={effMode}
            showModeSwitch={darkEnabled}
            onPreviewModeChange={setPreviewMode}
          />
        )
      })()}
    </div>
  )
}

export default PushConfigForm
