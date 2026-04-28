import { DatePicker, TimePicker, Typography } from 'antd'
import dayjs from 'dayjs'
import { useTaskFormContext } from '../hooks/useTaskForm'
import TimezoneTooltip from './TimezoneTooltip'

const { Text } = Typography

function ScheduleOnceForm() {
  const { state, updatePushTiming } = useTaskFormContext()
  const { scheduleOnce } = state

  const dateValue = scheduleOnce.date ? dayjs(scheduleOnce.date) : null
  const timeValue = scheduleOnce.time ? dayjs(scheduleOnce.time, 'HH:mm') : null

  const handleDateChange = (date) => {
    updatePushTiming('scheduleOnce.date', date ? date.format('YYYY-MM-DD') : '')
  }

  const handleTimeChange = (time) => {
    updatePushTiming('scheduleOnce.time', time ? time.format('HH:mm') : '')
  }

  const isPastTime = () => {
    if (!scheduleOnce.date || !scheduleOnce.time) return false
    const pushMoment = dayjs(`${scheduleOnce.date} ${scheduleOnce.time}`)
    return pushMoment.isBefore(dayjs())
  }

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day')
  }

  const disabledTime = (_, type) => {
    if (type === 'minute') return []
    
    const now = dayjs()
    const isToday = scheduleOnce.date === now.format('YYYY-MM-DD')
    
    if (type === 'hour') {
      const hours = []
      for (let i = 0; i < 24; i++) {
        if (isToday && i < now.hour()) {
          hours.push(i)
        }
      }
      return hours
    }
    
    if (type === 'second') {
      const seconds = []
      for (let i = 0; i < 60; i++) {
        if (isToday && dayjs().hour() === (timeValue?.hour() || 0) && i < now.second()) {
          seconds.push(i)
        }
      }
      return seconds
    }
    
    return []
  }

  const showPastError = isPastTime()

  const previewText = scheduleOnce.date && scheduleOnce.time
    ? `${scheduleOnce.date} ${scheduleOnce.time}（用户时区）推送`
    : null

  return (
    <div style={{ fontSize: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px 16px', marginBottom: 16 }}>
        <label style={{ fontSize: 14, color: '#262626', minWidth: 80 }}>
          <Text type="danger">*</Text> 推送时间
        </label>
        <DatePicker
          value={dateValue}
          onChange={handleDateChange}
          placeholder="请选择日期"
          style={{ width: 180 }}
          status={showPastError ? 'error' : undefined}
          disabledDate={disabledDate}
        />
        <TimePicker
          value={timeValue}
          onChange={handleTimeChange}
          format="HH:mm"
          placeholder="请选择时间"
          style={{ width: 110 }}
          status={showPastError ? 'error' : undefined}
          disabledTime={disabledTime}
        />
        <TimezoneTooltip color="#1677ff">用户时区</TimezoneTooltip>
        {showPastError && (
          <div style={{ color: '#ff4d4f', fontSize: 13, marginLeft: 80, width: '100%' }}>
            推送时间不能早于当前时间
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
        }}>
          📅 {previewText}
        </div>
      )}
    </div>
  )
}

export default ScheduleOnceForm
