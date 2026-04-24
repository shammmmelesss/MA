import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Input, Tabs, Typography, Empty } from 'antd'
import { SearchOutlined, StarOutlined, StarFilled, UserOutlined, TeamOutlined, TagOutlined } from '@ant-design/icons'

const { Text } = Typography

const TYPE_ICONS = {
  text: '🅰',
  number: '①',
  object: '🔗',
  select: '🅰',
}

const TYPE_LABELS = {
  text: '文本',
  number: '数值',
  object: '对象组',
  select: '文本',
}

/* All available fields grouped by category */
const FIELD_GROUPS = [
  {
    category: 'user_attr',
    categoryLabel: '用户属性',
    icon: <UserOutlined />,
    fields: [
      { label: '账户ID', value: 'account_id', dataType: 'text' },
      { label: '目标平台', value: 'platform', dataType: 'select', selectValues: ['iOS', 'Android', 'Web'] },
      { label: '安卓版本', value: 'android_version', dataType: 'text' },
      { label: '国家', value: 'country', dataType: 'text' },
      { label: '语言', value: 'language', dataType: 'text' },
      { label: '设备型号', value: 'device_model', dataType: 'text' },
      { label: 'App版本', value: 'app_version', dataType: 'text' },
      { label: '注册渠道', value: 'register_channel', dataType: 'text' },
      { label: '当前攻击力', value: 'attack', dataType: 'number' },
      { label: '当前攻击速度', value: 'attack_speed', dataType: 'number' },
      { label: '当前暴击伤害', value: 'crit_damage', dataType: 'number' },
      { label: '当前暴击率', value: 'crit_rate', dataType: 'number' },
      { label: '当前钻石', value: 'diamond', dataType: 'number' },
      { label: '背包明细', value: 'inventory', dataType: 'object' },
    ],
  },
  {
    category: 'user_segment',
    categoryLabel: '用户分群',
    icon: <TeamOutlined />,
    fields: [
      { label: '分群20230714_173601', value: 'seg_20230714', dataType: 'segment', segType: 'ID 分群' },
      { label: '分群20251118_211734', value: 'seg_20251118', dataType: 'segment', segType: '结果分群' },
      { label: '第7次推送人群', value: 'seg_push7', dataType: 'segment', segType: '结果分群', tag: '运营' },
      { label: '分群1', value: 'seg_1', dataType: 'segment', segType: '结果分群' },
      { label: '12日付费用户', value: 'seg_pay12', dataType: 'segment', segType: '结果分群' },
    ],
  },
  {
    category: 'user_tag',
    categoryLabel: '用户标签',
    icon: <TagOutlined />,
    fields: [
      { label: 'VIP等级', value: 'tag_vip', dataType: 'text' },
      { label: '付费用户', value: 'tag_paid', dataType: 'text' },
      { label: '活跃度', value: 'tag_activity', dataType: 'number' },
    ],
  },
]

/* Flatten all fields for lookup */
const ALL_FIELDS = FIELD_GROUPS.flatMap(g => g.fields.map(f => ({ ...f, category: g.category, categoryLabel: g.categoryLabel })))

export const DEFAULT_FIELD = FIELD_GROUPS[0]?.fields[0]?.value ?? ''

export function getFieldMeta(value) {
  return ALL_FIELDS.find(f => f.value === value) || null
}

export function getFieldLabel(value) {
  return getFieldMeta(value)?.label || value
}

function FieldItem({ field, isFav, onToggleFav, onSelect, isActive }) {
  const typeLabel = field.segType || TYPE_LABELS[field.dataType] || field.dataType
  const typeIcon = TYPE_ICONS[field.dataType] || ''

  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); onSelect(field.value) }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', cursor: 'pointer', fontSize: 14,
        background: isActive ? '#f0f5ff' : 'transparent',
        borderRadius: 4,
      }}
      onMouseEnter={e => e.currentTarget.style.background = isActive ? '#f0f5ff' : '#fafafa'}
      onMouseLeave={e => e.currentTarget.style.background = isActive ? '#f0f5ff' : 'transparent'}
    >
      <span style={{ flex: 1 }}>
        {field.label}
        {field.tag && <span style={{ marginLeft: 8, fontSize: 12, color: '#8c8c8c' }}>{field.tag}</span>}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8c8c8c', fontSize: 13 }}>
        {typeIcon && <span>{typeIcon}</span>}
        <span>{typeLabel}</span>
        <span onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onToggleFav(field.value) }} style={{ cursor: 'pointer' }}>
          {isFav ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined style={{ color: '#d9d9d9' }} />}
        </span>
      </span>
    </div>
  )
}

function FieldSelector({ value, onChange, style }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fieldFavorites') || '[]') } catch { return [] }
  })
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleFav = (fieldValue) => {
    setFavorites(prev => {
      const next = prev.includes(fieldValue) ? prev.filter(v => v !== fieldValue) : [...prev, fieldValue]
      localStorage.setItem('fieldFavorites', JSON.stringify(next))
      return next
    })
  }

  const handleSelect = (fieldValue) => {
    onChange(fieldValue)
    setOpen(false)
    setSearch('')
  }

  const filteredGroups = useMemo(() => {
    let groups = FIELD_GROUPS
    if (activeTab === 'user_attr') groups = groups.filter(g => g.category === 'user_attr')
    else if (activeTab === 'user_segment') groups = groups.filter(g => g.category === 'user_segment')
    else if (activeTab === 'user_tag') groups = groups.filter(g => g.category === 'user_tag')

    if (search) {
      const q = search.toLowerCase()
      groups = groups.map(g => ({
        ...g,
        fields: g.fields.filter(f => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)),
      })).filter(g => g.fields.length > 0)
    }
    return groups
  }, [activeTab, search])

  const favFields = useMemo(() =>
    ALL_FIELDS.filter(f => favorites.includes(f.value)),
  [favorites])

  const selectedMeta = getFieldMeta(value)

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6,
          cursor: 'pointer', minWidth: 160, height: 32, fontSize: 14,
          background: '#fff',
          borderColor: open ? '#1677ff' : '#d9d9d9',
        }}
      >
        {selectedMeta ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
            <span>{selectedMeta.label}</span>
          </span>
        ) : (
          <span style={{ color: '#bfbfbf' }}>选择字段</span>
        )}
        <span style={{ marginLeft: 'auto', color: '#bfbfbf', fontSize: 12 }}>▾</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100,
          width: 360, maxHeight: 420, background: '#fff',
          border: '1px solid #e8e8e8', borderRadius: 8,
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
          marginTop: 4, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 12px 0' }}>
            <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入搜索" value={search} onChange={e => setSearch(e.target.value)}
              allowClear size="small" style={{ marginBottom: 8 }} />
            <Tabs size="small" activeKey={activeTab} onChange={setActiveTab}
              items={[
                { key: 'all', label: '全部' },
                { key: 'user_attr', label: '用户属性' },
                { key: 'user_segment', label: '用户分群' },
                { key: 'user_tag', label: '用户标签' },
              ]} style={{ marginBottom: 0 }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 8px' }}>
            {/* Favorites */}
            {favFields.length > 0 && (
              <div style={{ padding: '8px 8px 4px' }}>
                <Text style={{ fontSize: 13, color: '#faad14' }}>⭐ 收藏</Text>
                {favFields.map(f => (
                  <FieldItem key={f.value} field={f} isFav onToggleFav={toggleFav}
                    onSelect={handleSelect} isActive={value === f.value} />
                ))}
              </div>
            )}

            {/* Groups */}
            {filteredGroups.map(g => (
              <div key={g.category} style={{ padding: '8px 8px 4px' }}>
                <Text style={{ fontSize: 13, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  {g.icon} {g.categoryLabel}
                </Text>
                {g.fields.map(f => (
                  <FieldItem key={f.value} field={f} isFav={favorites.includes(f.value)}
                    onToggleFav={toggleFav} onSelect={handleSelect} isActive={value === f.value} />
                ))}
              </div>
            ))}

            {filteredGroups.length === 0 && favFields.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配字段" style={{ padding: 24 }} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FieldSelector
