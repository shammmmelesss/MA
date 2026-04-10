import { useMemo } from 'react'
import { Select, Radio, Switch, InputNumber, Tooltip, Typography, DatePicker } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTaskFormContext } from '../hooks/useTaskForm'

const { Text } = Typography

const cycleOptions = [
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
]

const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const weekDayOptions = weekDayLabels.map((label, i) => ({ label, value: i + 1 }))

const monthDayOptions = Array.from({ length: 31 }, (_, i) => i + 1)

function ScheduleRepeatForm() {
  const { state, updatePushTiming } = useTaskFormContext()
  const { scheduleRepeat } = state
  const { cycle, weekDays, monthDays, time, endDate } = scheduleRepeat

  const timeValue = time ? dayjs(time, 'HH:mm') : null
  const dateRangeValue = scheduleRepeat.startDate && scheduleRepeat.endDate
    ? [dayjs(scheduleRepeat.startDate), dayjs(scheduleRepeat.endDate)]
    : null

  const handleCycleChange = (val) => {
    updatePushTiming('scheduleRepeat.cycle', val)
    updatePushTiming('scheduleRepeat.weekDays', [])
    updatePushTiming('scheduleRepeat.monthDays', [])
  }

  const handleTimeChange = (t) => {
    updatePushTiming('scheduleRepeat.time', t ? t.format('HH:mm') : '')
  }

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      updatePushTiming('scheduleRepeat.startDate', dates[0] ? dates[0].format('YYYY-MM-DD') : null)
      updatePushTiming('scheduleRepeat.endDate', dates[1] ? dates[1].format('YYYY-MM-DD') : null)
    } else {
      updatePushTiming('scheduleRepeat.startDate', null)
      updatePushTiming('scheduleRepeat.endDate', null)
    }
  }

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day')
  }

  const dateRangeError = scheduleRepeat.startDate && scheduleRepeat.endDate && 
    dayjs(scheduleRepeat.endDate).isBefore(dayjs(scheduleRepeat.startDate), 'day')

  // Preview text
  const previewText = useMemo(() => {
    if (!cycle || !time) return null
    const parts = []
    if (cycle === 'daily') {
      parts.push('每天')
    } else if (cycle === 'weekly' && weekDays.length > 0) {
      const dayNames = weekDays.sort((a, b) => a - b).map(d => weekDayLabels[d - 1])
      parts.push(`每周${dayNames.join('、')}`)
    } else if (cycle === 'monthly' && monthDays.length > 0) {
      const sorted = [...monthDays].sort((a, b) => a - b)
      parts.push(`每月${sorted.join('、')}号`)
    } else {
      return null
    }
    parts.push(`${time}（用户时区）推送`)
    if (scheduleRepeat.startDate && scheduleRepeat.endDate) {
      parts.push(`\n📆 日期范围：${scheduleRepeat.startDate} → ${scheduleRepeat.endDate}`)
    }
    return parts.join(' ')
  }, [cycle, weekDays, monthDays, time, scheduleRepeat.startDate, scheduleRepeat.endDate])

  return (
    <div style={{ fontSize: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px 16px', marginBottom: 16 }}>
        <label style={{ fontSize: 14, color: '#262626', minWidth: 80 }}>
          <Text type="danger">*</Text> 推送时间
        </label>
        <Select
          value={cycle || undefined}
          onChange={handleCycleChange}
          options={cycleOptions}
          placeholder="请选择重复周期"
          style={{ width: 110 }}
        />
        {cycle === 'weekly' && (
          <Select
            mode="multiple"
            value={weekDays}
            onChange={(vals) => updatePushTiming('scheduleRepeat.weekDays', vals)}
            options={weekDayOptions}
            placeholder="请选择重复日期"
            style={{ width: 180 }}
            maxTagCount="responsive"
          />
        )}
        {cycle === 'monthly' && (
          <Select
            mode="multiple"
            value={monthDays}
            onChange={(vals) => updatePushTiming('scheduleRepeat.monthDays', vals)}
            options={monthDayOptions.map(day => ({ label: day, value: day }))}
            placeholder="请选择重复日期"
            style={{ width: 180 }}
            maxTagCount="responsive"
          />
        )}
        <DatePicker.TimePicker
          value={timeValue}
          onChange={handleTimeChange}
          format="HH:mm"
          placeholder="请选择时间"
          style={{ width: 110 }}
        />
        <Tooltip title="推送将按用户设备所在时区执行">
          <span style={{ color: '#8c8c8c', cursor: 'pointer', fontSize: 14 }}>
            用户时区
          </span>
        </Tooltip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#262626' }}>
          <Text type="danger">*</Text> 日期范围
        </label>
        <DatePicker.RangePicker
          value={dateRangeValue}
          onChange={handleDateRangeChange}
          placeholder={['开始日期', '结束日期']}
          style={{ width: 260 }}
          disabledDate={disabledDate}
          status={dateRangeError ? 'error' : undefined}
        />
        {dateRangeError && (
          <div style={{ color: '#ff4d4f', fontSize: 13, marginTop: 6 }}>
            结束日期不能早于开始日期
          </div>
        )}
      </div>

      {/* 频率控制 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <label style={{ fontSize: 14, color: '#262626' }}>频率控制</label>
          <Tooltip title="每个用户在一段时间内可接收的最大推送次数限制">
            <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
          </Tooltip>
          <Switch size="small" checked={scheduleRepeat.frequencyEnabled}
            onChange={v => updatePushTiming('scheduleRepeat.frequencyEnabled', v)} />
        </div>

        {scheduleRepeat.frequencyEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 单个周期内 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio checked={scheduleRepeat.frequencyMode === 'per_cycle'}
                onChange={() => updatePushTiming('scheduleRepeat.frequencyMode', 'per_cycle')} />
              <Text>单个任务周期内，用户最多接收</Text>
              <InputNumber min={1} style={{ width: 80 }}
                value={scheduleRepeat.frequencyPerCycle}
                disabled={scheduleRepeat.frequencyMode !== 'per_cycle'}
                onChange={v => updatePushTiming('scheduleRepeat.frequencyPerCycle', v)} />
              <Text>次推送</Text>
            </div>

            {/* 滑动窗口 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio checked={scheduleRepeat.frequencyMode === 'sliding'}
                onChange={() => updatePushTiming('scheduleRepeat.frequencyMode', 'sliding')} />
              <InputNumber min={1} style={{ width: 80 }}
                value={scheduleRepeat.slidingWindowDays}
                disabled={scheduleRepeat.frequencyMode !== 'sliding'}
                onChange={v => updatePushTiming('scheduleRepeat.slidingWindowDays', v)} />
              <Select style={{ width: 80 }}
                value={scheduleRepeat.slidingWindowUnit || 'day'}
                disabled={scheduleRepeat.frequencyMode !== 'sliding'}
                onChange={v => updatePushTiming('scheduleRepeat.slidingWindowUnit', v)}
                options={[
                  { label: '天', value: 'day' },
                  { label: '周', value: 'week' },
                  { label: '月', value: 'month' },
                ]} />
              <Text>内单个用户最多接收</Text>
              <InputNumber min={1} style={{ width: 80 }}
                value={scheduleRepeat.slidingWindowMax}
                disabled={scheduleRepeat.frequencyMode !== 'sliding'}
                onChange={v => updatePushTiming('scheduleRepeat.slidingWindowMax', v)} />
              <Text>次推送</Text>
            </div>

            {/* 滚动窗口 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio checked={scheduleRepeat.frequencyMode === 'rolling'}
                onChange={() => updatePushTiming('scheduleRepeat.frequencyMode', 'rolling')} />
              <Text>每</Text>
              <InputNumber min={1} style={{ width: 80 }}
                value={scheduleRepeat.rollingInterval}
                disabled={scheduleRepeat.frequencyMode !== 'rolling'}
                onChange={v => updatePushTiming('scheduleRepeat.rollingInterval', v)} />
              <Select style={{ width: 80 }}
                value={scheduleRepeat.rollingUnit || 'day'}
                disabled={scheduleRepeat.frequencyMode !== 'rolling'}
                onChange={v => updatePushTiming('scheduleRepeat.rollingUnit', v)}
                options={[
                  { label: '天', value: 'day' },
                  { label: '周', value: 'week' },
                  { label: '月', value: 'month' },
                ]} />
              <Text>内单个用户最多接收</Text>
              <InputNumber min={1} style={{ width: 80 }}
                value={scheduleRepeat.rollingMax}
                disabled={scheduleRepeat.frequencyMode !== 'rolling'}
                onChange={v => updatePushTiming('scheduleRepeat.rollingMax', v)} />
              <Text>次推送</Text>
            </div>
          </div>
        )}
      </div>

      {previewText && (
        <div style={{
          padding: '14px 18px',
          background: '#f6f8fa',
          borderRadius: 8,
          color: '#262626',
          fontSize: 14,
          border: '1px solid #e8e8e8',
          whiteSpace: 'pre-line',
        }}>
          📅 {previewText}
        </div>
      )}
    </div>
  )
}

export default ScheduleRepeatForm
