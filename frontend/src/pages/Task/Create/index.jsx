import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ConfigProvider } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import { TaskFormProvider, useTaskFormContext } from './hooks/useTaskForm'
import TopBar from './components/TopBar'
import PushTimingForm from './components/PushTimingForm'
import TargetUserForm from './components/TargetUserForm'
import PushConfigForm from './components/PushConfigForm'

const sections = [
  { id: 'push-timing', label: '推送时机', step: '1' },
  { id: 'target-user', label: '目标用户', step: '2' },
  { id: 'push-config', label: '推送配置', step: '3' },
  { id: 'goal-setting', label: '目标设置 (规划)', step: '4' },
]

function StepNavigator({ activeId, onNavigate }) {
  return (
    <div style={{ padding: 24, width: 200 }}>
      {sections.map((sec) => {
        const isActive = activeId === sec.id
        return (
          <div
            key={sec.id}
            onClick={() => onNavigate(sec.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 24,
              cursor: 'pointer',
              color: isActive ? '#1677ff' : '#333',
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: isActive ? '#1677ff' : 'transparent',
              border: isActive ? 'none' : '1px solid #d9d9d9',
              color: isActive ? '#fff' : '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              fontSize: 12,
            }}>
              {isActive ? '✓' : sec.step}
            </div>
            <span>{sec.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function CreatePushTaskInner() {
  const [activeSection, setActiveSection] = useState('push-timing')
  const scrollContainerRef = useRef(null)
  const isClickScrolling = useRef(false)

  // Scroll spy: track which section is in view
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isClickScrolling.current) return
      const offset = 100 // threshold from top of scroll container
      let current = sections[0].id
      for (const sec of sections) {
        const el = document.getElementById(sec.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          if (rect.top - containerRect.top <= offset) {
            current = sec.id
          }
        }
      }
      setActiveSection(current)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavigate = useCallback((id) => {
    const container = scrollContainerRef.current
    const el = document.getElementById(id)
    if (!container || !el) return

    setActiveSection(id)
    isClickScrolling.current = true

    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const scrollTop = container.scrollTop + (elRect.top - containerRect.top) - 24

    container.scrollTo({ top: scrollTop, behavior: 'smooth' })

    // Re-enable scroll spy after animation
    setTimeout(() => { isClickScrolling.current = false }, 600)
  }, [])

  return (
    <div className="task-create-page" style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <div style={{ 
          background: '#fff', 
          borderRight: '1px solid #e8e8e8',
          position: 'fixed',
          left: 0,
          top: 64,
          bottom: 0,
          width: 200,
          zIndex: 10
        }}>
          <StepNavigator activeId={activeSection} onNavigate={handleNavigate} />
        </div>
        <div
          ref={scrollContainerRef}
          style={{ 
            flex: 1, 
            padding: '88px 24px 40px',
            marginLeft: 200,
            overflow: 'auto',
            height: 'calc(100vh - 64px)'
          }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: '32px 40px',
            maxWidth: 1200,
            margin: '0 auto',
          }}>
            <div id="push-timing">
              <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 600, color: '#262626' }}>推送时机</h2>
              <PushTimingForm />
            </div>
            
            <div style={{ borderTop: '1px solid #e8e8e8', margin: '24px 0' }} />
            
            <div id="target-user">
              <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 600, color: '#262626' }}>目标用户</h2>
              <TargetUserForm />
            </div>
            
            <div style={{ borderTop: '1px solid #e8e8e8', margin: '24px 0' }} />
            
            <div id="push-config">
              <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 600, color: '#262626' }}>推送配置</h2>
              <PushConfigForm />
            </div>
            
            <div style={{ borderTop: '1px solid #e8e8e8', margin: '24px 0' }} />
            
            <div id="goal-setting">
              <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 600, color: '#262626' }}>目标设置</h2>
              <div className="goal-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', color: '#8c8c8c', background: '#fafafa', borderRadius: 8 }}>
                <InboxOutlined style={{ fontSize: 40, marginBottom: 16, color: '#bfbfbf' }} />
                <span style={{ fontSize: 14 }}>该功能规划中，后续版本开放</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreatePushTask() {
  return (
    <ConfigProvider locale={zhCN}>
      <TaskFormProvider>
        <CreatePushTaskInner />
      </TaskFormProvider>
    </ConfigProvider>
  )
}

export default CreatePushTask
