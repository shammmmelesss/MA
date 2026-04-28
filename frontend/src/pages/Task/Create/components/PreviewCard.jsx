import React, { useState } from 'react'
import { Typography, Button, Modal, Form, Input, message } from 'antd'
import { testSend } from '../api'

const { Text } = Typography

function PreviewCard({ title, content, imageUrl, style: notifStyle = {} }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleTestSend = async () => {
    try {
      const { luid } = await form.validateFields()
      setLoading(true)
      await testSend({ luid, title, content, image_url: imageUrl })
      message.success('测试推送已发送')
      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      if (err?.errorFields) return
      message.error('发送失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }
  const isFloating = notifStyle.basic === 'floating'

  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      position: 'sticky',
      top: 24,
      alignSelf: 'flex-start',
    }}>
      <Text strong style={{ display: 'block', marginBottom: 12 }}>预览</Text>

      {/* Phone frame */}
      <div style={{
        width: 320,
        minHeight: 200,
        background: '#1a1a2e',
        borderRadius: 24,
        padding: '40px 16px 24px',
        position: 'relative',
      }}>
        {/* Status bar */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          color: '#fff',
          fontSize: 12,
          opacity: 0.6,
        }}>
          <span>9:41</span>
          <span>📶 🔋</span>
        </div>

        {/* Notification card */}
        <div style={{
          background: isFloating ? 'rgba(255,255,255,0.95)' : '#fff',
          borderRadius: isFloating ? 16 : 12,
          padding: 12,
          boxShadow: isFloating
            ? '0 8px 24px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          ...(isFloating ? { margin: '0 4px' } : {}),
        }}>
          {/* App icon + title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
            }}>
              P
            </div>
            <Text style={{ fontSize: 12, color: '#999' }}>Push</Text>
            <Text style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto' }}>现在</Text>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                {title || '通知标题'}
              </Text>
              <Text style={{ fontSize: 13, color: '#666', display: 'block' }}>
                {content || '通知内容'}
              </Text>
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="通知图片"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        </div>

        {/* Vibrate / sound indicators */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 8,
          justifyContent: 'center',
        }}>
          {notifStyle.vibrate && (
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>📳 震动</Text>
          )}
          {notifStyle.sound && notifStyle.sound !== '' && (
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>🔔 提示音</Text>
          )}
        </div>
      </div>

      <Button
        type="primary"
        style={{ marginTop: 16, width: '100%' }}
        onClick={() => setModalOpen(true)}
      >
        测试发送
      </Button>

      <Modal
        title="测试发送"
        open={modalOpen}
        onOk={handleTestSend}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        okText="确定"
        cancelText="取消"
        confirmLoading={loading}
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 4 }}>
          <Form.Item
            label="luid"
            name="luid"
            rules={[{ required: true, message: '请输入luid' }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PreviewCard
