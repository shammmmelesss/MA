import React, { useEffect, useState, useContext } from 'react'
import { Select, Typography, Spin } from 'antd'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { getTopics } from '../api'
import { ProjectContext } from '../../../../App.jsx'

const { Text } = Typography

function TopicForm() {
  const { state, updatePushTiming } = useTaskFormContext()
  const { currentProject } = useContext(ProjectContext) || {}
  const [topicOptions, setTopicOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  const showError = touched && !state.topic

  useEffect(() => {
    if (!currentProject?.project_id) return
    setLoading(true)
    getTopics(currentProject.project_id)
      .then((data) => {
        const list = data?.topics || data || []
        setTopicOptions(Array.isArray(list) ? list : [])
      })
      .catch(() => setTopicOptions([]))
      .finally(() => setLoading(false))
  }, [currentProject])

  const handleTopicChange = (val) => {
    setTouched(true)
    updatePushTiming('topic', val)
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
            onChange={handleTopicChange}
            onBlur={() => setTouched(true)}
            placeholder="请选择 topic"
            style={{ width: 300 }}
            status={showError ? 'error' : undefined}
            options={topicOptions.map(t => ({
              label: t.name || t,
              value: t.topic_key || t.id || t,
            }))}
            showSearch
          />
        </Spin>
        {showError && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>请选择 topic</div>
        )}
      </div>
    </div>
  )
}

export default TopicForm
