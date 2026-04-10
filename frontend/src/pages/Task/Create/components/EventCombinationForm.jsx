import React, { useEffect, useState } from 'react'
import { Button, Select, Input, Space, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { getEvents } from '../api'

const { Text } = Typography

function FilterRow({ filter, onChange, onRemove }) {
  return (
    <Space style={{ marginTop: 8 }}>
      <Input
        placeholder="属性字段"
        value={filter.field}
        onChange={(e) => onChange('field', e.target.value)}
        style={{ width: 120 }}
      />
      <Select
        value={filter.operator || undefined}
        onChange={(val) => onChange('operator', val)}
        placeholder="运算符"
        style={{ width: 80 }}
        options={[
          { label: '=', value: '=' },
          { label: '≠', value: '!=' },
          { label: '>', value: '>' },
          { label: '<', value: '<' },
          { label: '≥', value: '>=' },
          { label: '≤', value: '<=' },
        ]}
      />
      <Input
        placeholder="值"
        value={filter.value}
        onChange={(e) => onChange('value', e.target.value)}
        style={{ width: 120 }}
      />
      <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </Space>
  )
}

function EventRow({ event, events, canDelete, onEventChange, onRemove, onAddFilter, onFilterChange, onRemoveFilter }) {
  return (
    <div style={{ padding: 12, border: '1px solid #f0f0f0', borderRadius: 6, marginBottom: 8 }}>
      <Space>
        <Select
          value={event.eventName || undefined}
          onChange={(val) => onEventChange(val)}
          placeholder="选择事件"
          style={{ width: 200 }}
          options={events.map(e => ({ label: e.name || e, value: e.name || e }))}
          showSearch
        />
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={onAddFilter}
          size="small"
        >
          筛选
        </Button>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          disabled={!canDelete}
        />
      </Space>
      {event.filters.map((f, idx) => (
        <FilterRow
          key={f.id || idx}
          filter={f}
          onChange={(field, value) => onFilterChange(idx, field, value)}
          onRemove={() => onRemoveFilter(idx)}
        />
      ))}
    </div>
  )
}

function EventCombinationForm({ eventItems, globalFilters, onUpdate, stateKey }) {
  const [eventOptions, setEventOptions] = useState([])

  useEffect(() => {
    getEvents().then((data) => {
      setEventOptions(Array.isArray(data) ? data : [])
    }).catch(() => setEventOptions([]))
  }, [])

  const updateEvents = (newEvents) => {
    onUpdate(`${stateKey}.events`, newEvents)
  }

  const handleAddEvent = () => {
    const id = String(Date.now())
    updateEvents([...eventItems, { id, eventName: '', filters: [] }])
  }

  const handleRemoveEvent = (eventId) => {
    if (eventItems.length <= 1) return
    updateEvents(eventItems.filter(e => e.id !== eventId))
  }

  const handleEventNameChange = (eventId, name) => {
    updateEvents(eventItems.map(e => e.id === eventId ? { ...e, eventName: name } : e))
  }

  const handleAddFilter = (eventId) => {
    updateEvents(eventItems.map(e => {
      if (e.id !== eventId) return e
      return {
        ...e,
        filters: [...e.filters, { id: String(Date.now()), field: '', operator: '=', value: '', logic: 'and' }],
      }
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

  // Global filters
  const handleAddGlobalFilter = () => {
    const newFilter = { id: String(Date.now()), field: '', operator: '=', value: '', logic: 'and' }
    onUpdate(`${stateKey}.globalFilters`, [...globalFilters, newFilter])
  }

  const handleGlobalFilterChange = (idx, field, value) => {
    const updated = [...globalFilters]
    updated[idx] = { ...updated[idx], [field]: value }
    onUpdate(`${stateKey}.globalFilters`, updated)
  }

  const handleRemoveGlobalFilter = (idx) => {
    onUpdate(`${stateKey}.globalFilters`, globalFilters.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Text strong>事件组合</Text>
      </div>
      {eventItems.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          events={eventOptions}
          canDelete={eventItems.length > 1}
          onEventChange={(name) => handleEventNameChange(event.id, name)}
          onRemove={() => handleRemoveEvent(event.id)}
          onAddFilter={() => handleAddFilter(event.id)}
          onFilterChange={(fIdx, field, val) => handleFilterChange(event.id, fIdx, field, val)}
          onRemoveFilter={(fIdx) => handleRemoveFilter(event.id, fIdx)}
        />
      ))}
      <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddEvent} style={{ marginBottom: 12 }}>
        添加事件
      </Button>

      <div style={{  paddingTop: 0, marginTop: 0 }}>
        <Text strong>且满足（全局筛选）</Text>
        {globalFilters.map((f, idx) => (
          <FilterRow
            key={f.id || idx}
            filter={f}
            onChange={(field, value) => handleGlobalFilterChange(idx, field, value)}
            onRemove={() => handleRemoveGlobalFilter(idx)}
          />
        ))}
        <Button type="link" icon={<PlusOutlined />} onClick={handleAddGlobalFilter} size="small" style={{ marginTop: 8 }}>
          添加全局筛选
        </Button>
      </div>
    </div>
  )
}

export default EventCombinationForm
