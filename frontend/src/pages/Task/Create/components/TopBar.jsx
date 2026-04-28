import React, { useState } from 'react'
import { Input, Button, Modal, message, Space, Typography, Select } from 'antd'
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
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitReason, setSubmitReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const [approver, setApprover] = useState('张三')

  const approverOptions = [
    { label: '张三', value: '张三' },
    { label: '李四', value: '李四' },
    { label: '王五', value: '王五' },
  ]

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
    if (!submitReason.trim()) {
      setReasonError(true)
      return
    }
    setSubmitting(true)
    try {
      const payload = getSubmitPayload()
      payload.status = 'submitted'
      payload.submit_reason = submitReason.trim()
      payload.approver = approver
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
      setSubmitModalOpen(false)
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
    setSubmitReason('')
    setReasonError(false)
    setApprover('张三')
    setSubmitModalOpen(true)
  }

  const handleSubmitModalCancel = () => {
    if (submitting) return
    setSubmitModalOpen(false)
  }

  const { Text } = Typography

  return (
    <>
    <Modal
      title="提示"
      open={submitModalOpen}
      onCancel={handleSubmitModalCancel}
      onOk={doSubmit}
      okText="确定"
      cancelText="取消"
      confirmLoading={submitting}
      width={460}
    >
      <p style={{ marginBottom: 4 }}>
        确定后将进入审批，确定提交吗？
        <Text type="secondary" style={{ fontSize: 13, marginLeft: 6 }}>
          （注意：审批超时将自动关闭任务！）
        </Text>
      </p>
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 6 }}>
          <Text type="danger">*</Text>
          <Text style={{ marginLeft: 2 }}>原因</Text>
        </div>
        <Input.TextArea
          value={submitReason}
          onChange={(e) => {
            setSubmitReason(e.target.value)
            if (e.target.value.trim()) setReasonError(false)
          }}
          placeholder="请输入"
          rows={3}
          status={reasonError ? 'error' : undefined}
        />
        {reasonError && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>请输入原因</div>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 6 }}>
          <Text>审批人</Text>
        </div>
        <Select
          value={approver}
          onChange={setApprover}
          options={approverOptions}
          style={{ width: '100%' }}
        />
      </div>
    </Modal>
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
    </>
  )
}

export default TopBar
