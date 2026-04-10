import React from 'react'
import { Radio, Space } from 'antd'
import { useTaskFormContext } from '../hooks/useTaskForm'
import ScheduleOnceForm from './ScheduleOnceForm'
import ScheduleRepeatForm from './ScheduleRepeatForm'
import TriggerAForm from './TriggerAForm'
import TriggerABForm from './TriggerABForm'
import TopicForm from './TopicForm'

const pushTypeOptions = [
  { label: '定时-单次', value: 'schedule_once' },
  { label: '定时-重复', value: 'schedule_repeat' },
  { label: '触发-完成A', value: 'trigger_a' },
  { label: '触发-完成A后未完成B', value: 'trigger_ab' },
  { label: 'topic', value: 'topic' },
]

const subFormMap = {
  schedule_once: ScheduleOnceForm,
  schedule_repeat: ScheduleRepeatForm,
  trigger_a: TriggerAForm,
  trigger_ab: TriggerABForm,
  topic: TopicForm,
}

function PushTimingForm() {
  const { state, resetPushTypeFields } = useTaskFormContext()
  const { pushType } = state

  const handleTypeChange = (e) => {
    const newType = e.target.value
    if (newType !== pushType) {
      resetPushTypeFields(newType)
    }
  }

  const SubForm = subFormMap[pushType]

  return (
    <div style={{ fontSize: 14 }}>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#262626', fontWeight: 'normal' }}>推送类型</label>
      <Radio.Group value={pushType} onChange={handleTypeChange} style={{ marginBottom: 16 }}>
        <Space size={24}>
          {pushTypeOptions.map((opt) => (
            <Radio key={opt.value} value={opt.value} style={{ fontSize: 14 }}>{opt.label}</Radio>
          ))}
        </Space>
      </Radio.Group>

      <div style={{ paddingTop: 0 }}>
        {SubForm && <SubForm />}
      </div>
    </div>
  )
}

export default PushTimingForm
