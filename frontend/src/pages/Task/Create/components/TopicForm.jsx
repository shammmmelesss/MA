import React, { useEffect, useState } from 'react'
import { Select, Typography, Spin } from 'antd'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { getTopics } from '../api'

const { Text } = Typography

function TopicForm() {
  const { state, updatePushTiming } = useTaskFormContext()
  const [topicOptions, setTopicOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  const showError = touched && !state.topic

  useEffect(() => {
    setLoading(true)
    getTopics()
      .then((data) => {
        setTopicOptions(Array.isArray(data) ? data : [])
      })
      .catch(() => setTopicOptions([]))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (val) => {
    setTouched(true)
    updatePushTiming('topic', val)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <Text type="danger">*</Text> Topic
        </label>
        <Spin spinning={loading}>
          <Select
            value={state.topic || undefined}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="请选择 topic"
            style={{ width: 300 }}
            status={showError ? 'error' : undefined}
            options={topicOptions.map(t => ({
              label: t.name || t,
              value: t.name || t,
            }))}
            showSearch
          />
        </Spin>
        {showError && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
            请选择 topic
          </div>
        )}
      </div>
    </div>
  )
}

export default TopicForm
