import React from 'react'
import { Select, Input, Button } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import FieldSelector, { getFieldMeta } from './FieldSelector'

const operatorOptions = [
  { label: '等于', value: '=' },
  { label: '不等于', value: '!=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' },
  { label: '包含', value: 'contains' },
  { label: '不包含', value: 'not_contains' },
]

const segmentOperators = [
  { label: '属于分群', value: 'in_segment' },
  { label: '不属于分群', value: 'not_in_segment' },
]

function getOperatorsForField(fieldValue) {
  const meta = getFieldMeta(fieldValue)
  if (!meta) return operatorOptions
  if (meta.dataType === 'segment') return segmentOperators
  if (meta.dataType === 'number') return operatorOptions
  // text / select
  return operatorOptions.filter(o => ['=', '!=', 'contains', 'not_contains'].includes(o.value))
}

function AttributeFilterRow({ filter, onChange, onRemove, showAdd, onAdd }) {
  const meta = getFieldMeta(filter.field)
  const ops = getOperatorsForField(filter.field)

  const renderValueInput = () => {
    if (meta?.dataType === 'select' && meta.selectValues) {
      return (
        <Select value={filter.value || undefined} onChange={(val) => onChange('value', val)}
          placeholder="请选择" style={{ width: 180 }}
          options={meta.selectValues.map(v => ({ label: v, value: v }))} />
      )
    }
    return (
      <Input value={filter.value} onChange={(e) => onChange('value', e.target.value)}
        placeholder="请输入值" style={{ width: 180 }} />
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <FieldSelector value={filter.field}
        onChange={(val) => onChange('field', val)}
        style={{ width: 160 }} />

      <Select value={filter.operator} onChange={(val) => onChange('operator', val)}
        style={{ width: 110 }} options={ops} />

      {renderValueInput()}

      {showAdd && (
        <Button type="link" size="small" icon={<PlusOutlined />} onClick={onAdd}>筛选</Button>
      )}
      <Button type="text" size="small" icon={<DeleteOutlined />} onClick={onRemove} style={{ color: '#bfbfbf' }} />
    </div>
  )
}

export default AttributeFilterRow
