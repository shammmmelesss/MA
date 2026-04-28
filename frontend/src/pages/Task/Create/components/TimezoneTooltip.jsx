import { useEffect, useState } from 'react'
import { Tooltip } from 'antd'

const TIMEZONES = [
  { label: '夏威夷 (HST)',  tz: 'Pacific/Honolulu' },
  { label: '美西 (PT)',     tz: 'America/Los_Angeles' },
  { label: '美东 (ET)',     tz: 'America/New_York' },
  { label: 'UTC',           tz: 'UTC' },
  { label: '伦敦 (GMT)',    tz: 'Europe/London' },
  { label: '巴黎 (CET)',    tz: 'Europe/Paris' },
  { label: '迪拜 (GST)',    tz: 'Asia/Dubai' },
  { label: '印度 (IST)',    tz: 'Asia/Kolkata' },
  { label: '北京 (CST)',    tz: 'Asia/Shanghai' },
  { label: '东京 (JST)',    tz: 'Asia/Tokyo' },
  { label: '悉尼 (AEDT)',  tz: 'Australia/Sydney' },
]

function formatTime(tz) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function TimezoneList() {
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ minWidth: 200 }}>
      <div style={{ marginBottom: 6, color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
        各时区当前时间
      </div>
      {TIMEZONES.map(({ label, tz }) => (
        <div key={tz} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, lineHeight: '22px' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{formatTime(tz)}</span>
        </div>
      ))}
    </div>
  )
}

function TimezoneTooltip({ children, color = '#1677ff' }) {
  return (
    <Tooltip title={<TimezoneList />} overlayStyle={{ maxWidth: 260 }}>
      <span style={{ color, cursor: 'pointer', fontSize: 14 }}>
        {children}
      </span>
    </Tooltip>
  )
}

export default TimezoneTooltip
