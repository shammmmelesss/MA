import React, { useState } from 'react'
import { Input, Button, Modal, message, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { createTask, updateTask } from '../api'

function TopBar() {
  const navigate = useNavigate()
  const { state, setTaskName, validateCurrentStep, getSubmitPayload } = useTaskFormContext()
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [taskId, setTaskId] = useState(null)

  const confirmLeave = () => {
    Modal.confirm({
      title: '是否放弃当前编辑？',
      onOk: () => navigate('/tasks/list'),
    })
  }

  const handleSaveDraft = async () => {
    if (!state.taskName?.trim()) {
      message.warning('请输入任务名称')
      return
    }
    setSaving(true)
    try {
      const payload = getSubmitPayload()
      payload.status = 'draft'
      const params = new URLSearchParams(window.location.search)
      const projectId = params.get('project_id') || localStorage.getItem('currentProjectId')
      if (projectId) payload.project_id = Number(projectId)
      payload.creator = '管理员'
      if (taskId) {
        await updateTask(taskId, payload)
      } else {
        const res = await createTask(payload)
        if (res.task_id) setTaskId(res.task_id)
      }
      message.success('草稿保存成功')
    } catch {
      message.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const doSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = getSubmitPayload()
      payload.status = 'submitted'
      const params = new URLSearchParams(window.location.search)
      const projectId = params.get('project_id') || localStorage.getItem('currentProjectId')
      if (projectId) payload.project_id = Number(projectId)
      payload.creator = '管理员'
      if (taskId) {
        await updateTask(taskId, payload)
      } else {
        const res = await createTask(payload)
        if (res.task_id) setTaskId(res.task_id)
      }
      message.success('提交成功')
      navigate('/tasks/list')
    } catch {
      message.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = () => {
    const { valid, errors } = validateCurrentStep()
    if (!valid) {
      message.warning(errors[0]?.message || '请完善表单信息')
      return
    }
    if (!state.taskName?.trim()) {
      message.warning('请输入任务名称')
      return
    }
    Modal.confirm({
      title: '提示',
      content: (
        <div>
          <p>提交后将进入审批，确定提交吗?</p>
          <p style={{ color: '#8c8c8c', fontSize: 13 }}>（注意：审批超时将自动关闭任务！）</p>
        </div>
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: doSubmit,
    })
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      padding: '0 32px',
      background: '#fff',
      borderBottom: '1px solid #e8e8e8',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={confirmLeave}
          style={{ marginRight: 16, fontSize: 16 }}
        />
        <Input
          value={state.taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="请输入任务名称"
          variant="borderless"
          style={{ fontSize: 18, fontWeight: 500, maxWidth: 400, color: '#262626' }}
        />
      </div>
      <Space size={12}>
        <Button 
          onClick={confirmLeave}
          style={{ fontSize: 14, height: 36, padding: '0 24px' }}
        >
          取消
        </Button>
        <Button 
          loading={saving} 
          onClick={handleSaveDraft}
          style={{ fontSize: 14, height: 36, padding: '0 24px', borderColor: '#1677ff', color: '#1677ff' }}
        >
          保存草稿
        </Button>
        <Button 
          type="primary" 
          loading={submitting} 
          onClick={handleSubmit}
          style={{ fontSize: 14, height: 36, padding: '0 24px' }}
        >
          提交
        </Button>
      </Space>
    </div>
  )
}

export default TopBar
