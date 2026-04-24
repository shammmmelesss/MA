import React from 'react'
import { DatePicker, TimePicker, Select, InputNumber, Switch, Typography, Space } from 'antd'
import dayjs from 'dayjs'
import { useTaskFormContext } from '../hooks/useTaskForm'
import EventCombinationForm from './EventCombinationForm'

const { Text } = Typography

function TriggerAForm({ stateKey = 'triggerA', extraContent }) {
  const { state, updatePushTiming } = useTaskFormContext()
  const data = state[stateKey]

  const handleDateChange = (field, date) => {
    updatePushTiming(`${stateKey}.${field}`, date ? date.format('YYYY-MM-DD') : '')
  }

  const handleTimeChange = (field, time) => {
    updatePushTiming(`${stateKey}.${field}`, time ? time.format('HH:mm') : '00:00')
  }

  return (
    <div>
      {/* 发送时间 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, color: '#262626' }}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>触发规则
        </label>
        <EventCombinationForm
          eventItems={data.events}
          eventLogic={data.eventLogic ?? 'and'}
          onUpdate={updatePushTiming}
          stateKey={stateKey}
        />
      </div>

      {extraContent}

      {/* 则 - 触达时机 */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text>则</Text>
        <Select
          value={data.deliveryTiming}
          onChange={(val) => updatePushTiming(`${stateKey}.deliveryTiming`, val)}
          style={{ width: 100 }}
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
              style={{ width: 90 }}
              options={[
                { label: '分钟', value: 'minutes' },
                { label: '小时', value: 'hours' },
                { label: '天', value: 'days' },
              ]}
            />
          </>
        )}
        <Text style={{ color: '#595959' }}>对受众用户进行触达</Text>
      </div>

      {/* 起止时间 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, color: '#262626' }}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>起止时间
        </label>
        <Space size={8} wrap>
          <DatePicker
            value={data.startDate ? dayjs(data.startDate) : null}
            onChange={(date) => handleDateChange('startDate', date)}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            style={{ width: 150 }}
          />
          <TimePicker
            value={data.startTime ? dayjs(data.startTime, 'HH:mm') : dayjs('00:00', 'HH:mm')}
            onChange={(time) => handleTimeChange('startTime', time)}
            format="HH:mm"
            style={{ width: 100 }}
          />
          <Text style={{ color: '#595959' }}>至</Text>
          <DatePicker
            value={data.endDate ? dayjs(data.endDate) : null}
            onChange={(date) => handleDateChange('endDate', date)}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            style={{ width: 150 }}
          />
          <TimePicker
            value={data.endTime ? dayjs(data.endTime, 'HH:mm') : dayjs('00:00', 'HH:mm')}
            onChange={(time) => handleTimeChange('endTime', time)}
            format="HH:mm"
            style={{ width: 100 }}
          />
        </Space>
        {data.startDate && data.endDate && data.startDate > data.endDate && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
            开始日期不能晚于结束日期
          </div>
        )}
      </div>

      {/* 频率控制 */}
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
                  onChange={(val) => updatePushTiming(`${stateKey}.frequency`, { ...data.frequency, daily: val || 0 })}
                  style={{ width: 80 }}
                />
                <Text>次</Text>
              </Space>
              <Space>
                <Text>每周最多</Text>
                <InputNumber
                  min={0}
                  value={data.frequency.weekly}
                  onChange={(val) => updatePushTiming(`${stateKey}.frequency`, { ...data.frequency, weekly: val || 0 })}
                  style={{ width: 80 }}
                />
                <Text>次</Text>
              </Space>
              <Space>
                <Text>每月最多</Text>
                <InputNumber
                  min={0}
                  value={data.frequency.monthly}
                  onChange={(val) => updatePushTiming(`${stateKey}.frequency`, { ...data.frequency, monthly: val || 0 })}
                  style={{ width: 80 }}
                />
                <Text>次</Text>
              </Space>
              <Space>
                <Text>触发间隔 ≥</Text>
                <InputNumber
                  min={0}
                  value={data.frequency.intervalMinutes}
                  onChange={(val) => updatePushTiming(`${stateKey}.frequency`, { ...data.frequency, intervalMinutes: val || 0 })}
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
