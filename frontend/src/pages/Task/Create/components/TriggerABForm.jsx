import React, { useEffect, useState } from 'react'
import { Select, InputNumber, Typography, Space } from 'antd'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { getEvents } from '../api'
import TriggerAForm from './TriggerAForm'

const { Text } = Typography

function TriggerABForm() {
  const { state, updatePushTiming } = useTaskFormContext()
  const { triggerAB } = state
  const [eventOptions, setEventOptions] = useState([])

  useEffect(() => {
    getEvents().then((data) => {
      setEventOptions(Array.isArray(data) ? data : [])
    }).catch(() => setEventOptions([]))
  }, [])

  const bEventExtra = (
    <div style={{  paddingTop: 16, marginTop: 8, marginBottom: 16 }}>
      <h4 style={{ marginBottom: 12 }}>B 事件配置（未完成事件）</h4>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <Text type="danger">*</Text> B 事件
        </label>
        <Select
          value={triggerAB.bEvent || undefined}
          onChange={(val) => updatePushTiming('triggerAB.bEvent', val)}
          placeholder="选择B事件"
          style={{ width: 200 }}
          options={eventOptions.map(e => ({ label: e.name || e, value: e.name || e }))}
          showSearch
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <Text type="danger">*</Text> 时间窗口
        </label>
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
          <Text>内未完成B则触发</Text>
        </Space>
      </div>
    </div>
  )

  return <TriggerAForm stateKey="triggerAB" extraContent={bEventExtra} />
}

export default TriggerABForm
