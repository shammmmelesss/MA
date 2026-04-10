import React from 'react'
import { DatePicker, Select, InputNumber, Switch, Typography, Space } from 'antd'
import dayjs from 'dayjs'
import { useTaskFormContext } from '../hooks/useTaskForm'
import EventCombinationForm from './EventCombinationForm'

const { Text } = Typography
const { RangePicker } = DatePicker

function TriggerAForm({ stateKey = 'triggerA', extraContent }) {
  const { state, updatePushTiming } = useTaskFormContext()
  const data = state[stateKey]

  const dateRange = (data.startDate && data.endDate)
    ? [dayjs(data.startDate), dayjs(data.endDate)]
    : null

  const handleDateRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      updatePushTiming(`${stateKey}.startDate`, dates[0].format('YYYY-MM-DD'))
      updatePushTiming(`${stateKey}.endDate`, dates[1].format('YYYY-MM-DD'))
    } else {
      updatePushTiming(`${stateKey}.startDate`, '')
      updatePushTiming(`${stateKey}.endDate`, '')
    }
  }

  const dateRangeError = data.startDate && data.endDate && data.startDate > data.endDate

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <Text type="danger">*</Text> 生效时间范围
        </label>
        <RangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          style={{ width: 320 }}
          status={dateRangeError ? 'error' : undefined}
        />
        {dateRangeError && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
            开始日期不能晚于结束日期
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <EventCombinationForm
          eventItems={data.events}
          globalFilters={data.globalFilters}
          onUpdate={updatePushTiming}
          stateKey={stateKey}
        />
      </div>

      {extraContent}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <Text type="danger">*</Text> 触达时机
        </label>
        <Space>
          <Select
            value={data.deliveryTiming}
            onChange={(val) => updatePushTiming(`${stateKey}.deliveryTiming`, val)}
            style={{ width: 120 }}
            options={[
              { label: '立即', value: 'immediate' },
              { label: '延迟', value: 'delay' },
            ]}
          />
          {data.deliveryTiming === 'delay' && (
            <>
              <InputNumber
                min={1}
                value={data.delayValue}
                onChange={(val) => updatePushTiming(`${stateKey}.delayValue`, val)}
                style={{ width: 80 }}
              />
              <Select
                value={data.delayUnit}
                onChange={(val) => updatePushTiming(`${stateKey}.delayUnit`, val)}
                style={{ width: 100 }}
                options={[
                  { label: '分钟', value: 'minutes' },
                  { label: '小时', value: 'hours' },
                  { label: '天', value: 'days' },
                ]}
              />
            </>
          )}
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>频率控制</label>
        <Switch
          checked={data.frequencyEnabled}
          onChange={(checked) => updatePushTiming(`${stateKey}.frequencyEnabled`, checked)}
        />
        {data.frequencyEnabled && (
          <div style={{ marginTop: 12, padding: 12, background: '#fafafa', borderRadius: 6 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Text>每日最多</Text>
                <InputNumber
                  min={0}
                  value={data.frequency.daily}
                  onChange={(val) => {
                    const f = { ...data.frequency, daily: val || 0 }
                    updatePushTiming(`${stateKey}.frequency`, f)
                  }}
                  style={{ width: 80 }}
                />
                <Text>次</Text>
              </Space>
              <Space>
                <Text>每周最多</Text>
                <InputNumber
                  min={0}
                  value={data.frequency.weekly}
                  onChange={(val) => {
                    const f = { ...data.frequency, weekly: val || 0 }
                    updatePushTiming(`${stateKey}.frequency`, f)
                  }}
                  style={{ width: 80 }}
                />
                <Text>次</Text>
              </Space>
              <Space>
                <Text>每月最多</Text>
                <InputNumber
                  min={0}
                  value={data.frequency.monthly}
                  onChange={(val) => {
                    const f = { ...data.frequency, monthly: val || 0 }
                    updatePushTiming(`${stateKey}.frequency`, f)
                  }}
                  style={{ width: 80 }}
                />
                <Text>次</Text>
              </Space>
              <Space>
                <Text>触发间隔 ≥</Text>
                <InputNumber
                  min={0}
                  value={data.frequency.intervalMinutes}
                  onChange={(val) => {
                    const f = { ...data.frequency, intervalMinutes: val || 0 }
                    updatePushTiming(`${stateKey}.frequency`, f)
                  }}
                  style={{ width: 80 }}
                />
                <Text>分钟</Text>
              </Space>
            </Space>
          </div>
        )}
      </div>
    </div>
  )
}

export default TriggerAForm
