import React from 'react'
import { Select, InputNumber, Typography, Space } from 'antd'
import { useTaskFormContext } from '../hooks/useTaskForm'
import TriggerAForm from './TriggerAForm'
import EventCombinationForm from './EventCombinationForm'

const { Text } = Typography

function TriggerABForm() {
  const { state, updatePushTiming } = useTaskFormContext()
  const { triggerAB } = state

  // EventCombinationForm uses stateKey="triggerAB.b" producing paths like "triggerAB.b.events"
  // Remap to the actual flat fields: bEvents, bEventLogic, etc.
  const updateBEvents = (field, value) => {
    const remapped = field.replace(/^triggerAB\.b\.(.+)$/, (_, key) => {
      const capitalized = key.charAt(0).toUpperCase() + key.slice(1)
      return `triggerAB.b${capitalized}`
    })
    updatePushTiming(remapped, value)
  }

  const bEventExtra = (
    <div style={{ paddingTop: 1, marginTop: 8, marginBottom: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Space>
          <Text>完成A后</Text>
          <InputNumber
            min={1}
            value={triggerAB.timeWindow}
            onChange={(val) => updatePushTiming('triggerAB.timeWindow', val)}
            style={{ width: 80 }}
          />
          <Select
            value={triggerAB.timeWindowUnit}
            onChange={(val) => updatePushTiming('triggerAB.timeWindowUnit', val)}
            style={{ width: 100 }}
            options={[
              { label: '小时', value: 'hours' },
              { label: '天', value: 'days' },
            ]}
          />
          <Text>内未完成以下事件</Text>
        </Space>
      </div>
      <label style={{ display: 'block', marginBottom: 8, color: '#262626' }}>
      
      </label>
      <EventCombinationForm
        eventItems={triggerAB.bEvents}
        eventLogic={triggerAB.bEventLogic ?? 'and'}
        eventTimeWindow={1}
        eventTimeWindowUnit="natural_day"
        hideTimeWindow
        simple
        title="未完成以下事件"
        onUpdate={updateBEvents}
        stateKey="triggerAB.b"
      />
    </div>
  )

  return <TriggerAForm stateKey="triggerAB" extraContent={bEventExtra} />
}

export default TriggerABForm
