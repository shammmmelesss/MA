import React, { useEffect, useState } from 'react'
import { Button, Select, InputNumber, Space, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined, CaretUpOutlined } from '@ant-design/icons'
import { getEvents } from '../api'

const { Text } = Typography

const COUNT_TYPE_OPTIONS = [
  { label: '总次数', value: 'total_count' },
  { label: '首次', value: 'first_time' },
  { label: '最近一次', value: 'last_time' },
]

const COUNT_OPERATOR_OPTIONS = [
  { label: '大于等于', value: '>=' },
  { label: '等于', value: '=' },
  { label: '小于等于', value: '<=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
]

const FILTER_OPERATOR_OPTIONS = [
  { label: '等于', value: '=' },
  { label: '不等于', value: '!=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' },
  { label: '有值', value: 'has_value' },
  { label: '无值', value: 'no_value' },
]

function LogicTag({ logic, onClick }) {
  return (
    <span onClick={onClick} style={{
      position: 'absolute',
      left: 2,
      top: '50%',
      transform: 'translateY(-50%)',
      padding: '2px 6px',
      border: '1px solid #1677ff',
      borderRadius: 4,
      color: '#1677ff',
      fontSize: 12,
      cursor: 'pointer',
      userSelect: 'none',
      lineHeight: '20px',
      background: '#fff',
      zIndex: 1,
    }}>
      {logic === 'and' ? '且' : '或'}
    </span>
  )
}

function GroupLine() {
  return (
    <div style={{
      position: 'absolute',
      left: 14,
      top: 20,
      bottom: 20,
      width: 1,
      background: '#d9d9d9',
    }} />
  )
}

function FilterRow({ filter, onChange, onRemove, fieldOptions }) {
  const noValueOp = filter.operator === 'has_value' || filter.operator === 'no_value'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <Select
        value={filter.field || undefined}
        onChange={(val) => onChange('field', val)}
        placeholder="属性字段"
        style={{ width: 130 }}
        options={fieldOptions}
        showSearch
      />
      <Select
        value={filter.operator || undefined}
        onChange={(val) => onChange('operator', val)}
        placeholder="运算符"
        style={{ width: 100 }}
        options={FILTER_OPERATOR_OPTIONS}
      />
      {!noValueOp && (
        <Select
          value={filter.value || undefined}
          onChange={(val) => onChange('value', val)}
          placeholder="值"
          style={{ width: 100 }}
          options={[]}
          mode="tags"
          maxTagCount={1}
        />
      )}
      <Button type="text" icon={<DeleteOutlined />} onClick={onRemove} size="small" style={{ color: '#bfbfbf' }} />
    </div>
  )
}

function EventRow({ event, eventOptions, fieldOptions, canDelete, onChange, onRemove, onAddFilter, onFilterChange, onRemoveFilter, onFilterLogicToggle }) {
  const filterLogic = event.filters[0]?.logic || 'and'
  return (
    <div style={{ padding: '10px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Select
          value={event.eventName || undefined}
          onChange={(val) => onChange('eventName', val)}
          placeholder="选择事件"
          style={{ width: 180 }}
          options={eventOptions}
          showSearch
        />
        <Select
          value={event.countType}
          onChange={(val) => onChange('countType', val)}
          style={{ width: 100 }}
          options={COUNT_TYPE_OPTIONS}
        />
        <Select
          value={event.countOperator}
          onChange={(val) => onChange('countOperator', val)}
          style={{ width: 110 }}
          options={COUNT_OPERATOR_OPTIONS}
        />
        <InputNumber
          min={1}
          value={event.countValue}
          onChange={(val) => onChange('countValue', val)}
          style={{ width: 70 }}
        />
        <Text style={{ color: '#595959' }}>次</Text>
        <Button type="link" size="small" style={{ padding: 0 }} onClick={onAddFilter}>
          + 筛选
        </Button>
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          disabled={!canDelete}
          size="small"
          style={{ color: canDelete ? '#bfbfbf' : undefined }}
        />
      </div>
      {event.filters.length > 0 && (
        <div style={{ position: 'relative', paddingLeft: event.filters.length > 1 ? 40 : 8, marginTop: 8 }}>
          {event.filters.length > 1 && (
            <>
              <GroupLine />
              <LogicTag logic={filterLogic} onClick={onFilterLogicToggle} />
            </>
          )}
          {event.filters.map((f, idx) => (
            <FilterRow
              key={f.id || idx}
              filter={f}
              fieldOptions={fieldOptions}
              onChange={(field, value) => onFilterChange(idx, field, value)}
              onRemove={() => onRemoveFilter(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCombinationForm({ eventItems, eventLogic = 'and', onUpdate, stateKey }) {
  const [eventOptions, setEventOptions] = useState([])
  const [fieldOptions, setFieldOptions] = useState([])

  useEffect(() => {
    getEvents().then((data) => {
      const opts = Array.isArray(data) ? data : []
      setEventOptions(opts.map(e => ({ label: e.name || e, value: e.name || e })))
    }).catch(() => setEventOptions([]))
  }, [])

  const updateEvents = (newEvents) => onUpdate(`${stateKey}.events`, newEvents)

  const handleEventLogicToggle = () => {
    onUpdate(`${stateKey}.eventLogic`, eventLogic === 'and' ? 'or' : 'and')
  }

  const handleAddEvent = () => {
    const id = String(Date.now())
    updateEvents([...eventItems, { id, eventName: '', countType: 'total_count', countOperator: '>=', countValue: 1, filters: [] }])
  }

  const handleRemoveEvent = (eventId) => {
    if (eventItems.length <= 1) return
    updateEvents(eventItems.filter(e => e.id !== eventId))
  }

  const handleEventChange = (eventId, field, value) => {
    updateEvents(eventItems.map(e => e.id === eventId ? { ...e, [field]: value } : e))
  }

  const handleAddFilter = (eventId) => {
    updateEvents(eventItems.map(e => {
      if (e.id !== eventId) return e
      return { ...e, filters: [...e.filters, { id: String(Date.now()), field: '', operator: 'has_value', value: '', logic: 'and' }] }
    }))
  }

  const handleFilterChange = (eventId, filterIdx, field, value) => {
    updateEvents(eventItems.map(e => {
      if (e.id !== eventId) return e
      const newFilters = [...e.filters]
      newFilters[filterIdx] = { ...newFilters[filterIdx], [field]: value }
      return { ...e, filters: newFilters }
    }))
  }

  const handleRemoveFilter = (eventId, filterIdx) => {
    updateEvents(eventItems.map(e => {
      if (e.id !== eventId) return e
      return { ...e, filters: e.filters.filter((_, i) => i !== filterIdx) }
    }))
  }

  const handleFilterLogicToggle = (eventId) => {
    updateEvents(eventItems.map(e => {
      if (e.id !== eventId || !e.filters.length) return e
      const cur = e.filters[0]?.logic || 'and'
      const next = cur === 'and' ? 'or' : 'and'
      return { ...e, filters: e.filters.map(f => ({ ...f, logic: next })) }
    }))
  }

  return (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        <Space size={6}>
          <CaretUpOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
          <Text strong style={{ fontSize: 13 }}>完成以下事件</Text>
        </Space>
        <Button type="link" size="small" icon={<PlusOutlined />} onClick={handleAddEvent} style={{ padding: 0 }}>
          添加事件
        </Button>
      </div>

      {/* Event rows connected by a single vertical line */}
      <div style={{
        borderBottom: '1px solid #f0f0f0',
        position: 'relative',
        paddingLeft: eventItems.length > 1 ? 40 : 0,
      }}>
        {eventItems.length > 1 && (
          <>
            <GroupLine />
            <LogicTag logic={eventLogic} onClick={handleEventLogicToggle} />
          </>
        )}
        {eventItems.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            eventOptions={eventOptions}
            fieldOptions={fieldOptions}
            canDelete={eventItems.length > 1}
            onChange={(field, value) => handleEventChange(event.id, field, value)}
            onRemove={() => handleRemoveEvent(event.id)}
            onAddFilter={() => handleAddFilter(event.id)}
            onFilterChange={(fIdx, field, val) => handleFilterChange(event.id, fIdx, field, val)}
            onRemoveFilter={(fIdx) => handleRemoveFilter(event.id, fIdx)}
            onFilterLogicToggle={() => handleFilterLogicToggle(event.id)}
          />
        ))}
      </div>


      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #f0f0f0',
        color: '#8c8c8c',
        fontSize: 13,
      }}>
        在计划起止时间内完成后
      </div>
    </div>
  )
}

export default EventCombinationForm
