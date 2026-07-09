import React, { useEffect, useState } from 'react'
import {
  Select, Typography, Spin, Switch, Button, Input,
  Card, Space, Tag, Divider, Tooltip
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  HolderOutlined
} from '@ant-design/icons'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { getTopics } from '../api'

const { Text } = Typography
const { TextArea } = Input

// 内置用户属性字段（供分桶 filter 选择）
const FILTER_FIELDS = [
  { label: '账户ID', value: 'account_id' },
  { label: '等级', value: 'level' },
  { label: 'VIP等级', value: 'vip_level' },
  { label: '性别', value: 'gender' },
]

const OPERATORS = [
  { label: '等于', value: '=' },
  { label: '不等于', value: '!=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' },
  { label: '有值', value: 'has_value' },
  { label: '无值', value: 'no_value' },
]

let _id = 1000
const genId = () => String(++_id)

function newBucket(isDefault = false) {
  return {
    bucket_id: genId(),
    label: isDefault ? '默认（兜底）' : '新分桶',
    priority: isDefault ? 99 : 1,
    user_filters: [],
    content: { title: '', body: '' },
  }
}

function BucketFilterRow({ filter, onChange, onRemove }) {
  const noValue = filter.operator === 'has_value' || filter.operator === 'no_value'
  return (
    <Space style={{ marginBottom: 4 }} wrap>
      <Select
        value={filter.field}
        onChange={v => onChange({ ...filter, field: v })}
        options={FILTER_FIELDS}
        style={{ width: 120 }}
        size="small"
        placeholder="字段"
      />
      <Select
        value={filter.operator}
        onChange={v => onChange({ ...filter, operator: v })}
        options={OPERATORS}
        style={{ width: 100 }}
        size="small"
        placeholder="运算符"
      />
      {!noValue && (
        <Input
          value={filter.value}
          onChange={e => onChange({ ...filter, value: e.target.value })}
          style={{ width: 100 }}
          size="small"
          placeholder="值"
        />
      )}
      <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </Space>
  )
}

function BucketCard({ bucket, index, total, onChange, onMoveUp, onMoveDown, onRemove, isDefault }) {
  const addFilter = () => {
    onChange({
      ...bucket,
      user_filters: [...bucket.user_filters, { id: genId(), field: 'account_id', operator: '=', value: '', logic: 'and' }],
    })
  }

  const updateFilter = (idx, updated) => {
    const filters = [...bucket.user_filters]
    filters[idx] = updated
    onChange({ ...bucket, user_filters: filters })
  }

  const removeFilter = (idx) => {
    onChange({ ...bucket, user_filters: bucket.user_filters.filter((_, i) => i !== idx) })
  }

  return (
    <Card
      size="small"
      style={{ marginBottom: 12, border: isDefault ? '1px dashed #1677ff' : undefined }}
      title={
        <Space>
          <HolderOutlined style={{ color: '#999', cursor: 'grab' }} />
          <Input
            value={bucket.label}
            onChange={e => onChange({ ...bucket, label: e.target.value })}
            style={{ width: 160, fontWeight: 500 }}
            size="small"
            bordered={false}
          />
          {isDefault && <Tag color="blue">兜底</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="上移">
            <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={onMoveUp} />
          </Tooltip>
          <Tooltip title="下移">
            <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={index === total - 1} onClick={onMoveDown} />
          </Tooltip>
          {!isDefault && (
            <Tooltip title="删除分桶">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />
            </Tooltip>
          )}
        </Space>
      }
    >
      {/* 用户条件 */}
      {!isDefault && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>用户条件（满足以下 AND 条件的用户进入此桶）</Text>
          <div style={{ marginTop: 6 }}>
            {bucket.user_filters.map((f, idx) => (
              <BucketFilterRow
                key={f.id || idx}
                filter={f}
                onChange={updated => updateFilter(idx, updated)}
                onRemove={() => removeFilter(idx)}
              />
            ))}
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addFilter}>
              添加条件
            </Button>
          </div>
        </div>
      )}
      {isDefault && (
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>兜底桶：无需配置条件，所有未匹配用户进入此桶</Text>
        </div>
      )}

      <Divider style={{ margin: '8px 0' }} />

      {/* 消息内容 */}
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>消息内容（支持 {'{{username}}'} {'{{level}}'} 等变量）</Text>
        <Input
          value={bucket.content.title}
          onChange={e => onChange({ ...bucket, content: { ...bucket.content, title: e.target.value } })}
          placeholder="通知标题"
          style={{ marginTop: 6, marginBottom: 6 }}
        />
        <TextArea
          value={bucket.content.body}
          onChange={e => onChange({ ...bucket, content: { ...bucket.content, body: e.target.value } })}
          placeholder="通知内容"
          rows={2}
        />
      </div>
    </Card>
  )
}

function TopicForm() {
  const { state, updatePushTiming } = useTaskFormContext()
  const [topicOptions, setTopicOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)

  const showError = touched && !state.topic
  const personalized = state.topicPersonalized || false

  // 分桶列表，存入 state.topicBuckets
  const buckets = state.topicBuckets || []

  useEffect(() => {
    setLoading(true)
    getTopics()
      .then((data) => {
        const list = data?.topics || data || []
        setTopicOptions(Array.isArray(list) ? list : [])
      })
      .catch(() => setTopicOptions([]))
      .finally(() => setLoading(false))
  }, [])

  const handleTopicChange = (val) => {
    setTouched(true)
    updatePushTiming('topic', val)
  }

  const handlePersonalizedChange = (checked) => {
    updatePushTiming('topicPersonalized', checked)
    if (checked && buckets.length === 0) {
      // 初始化两个桶：一个条件桶 + 一个兜底桶
      updatePushTiming('topicBuckets', [
        newBucket(false),
        newBucket(true),
      ])
    }
  }

  const updateBucket = (idx, updated) => {
    const next = [...buckets]
    next[idx] = { ...updated, priority: idx + 1 }
    updatePushTiming('topicBuckets', next)
  }

  const addBucket = () => {
    // 在倒数第二的位置插入（兜底桶保持最后）
    const defaultBucket = buckets[buckets.length - 1]
    const newB = newBucket(false)
    const next = [...buckets.slice(0, -1), newB, defaultBucket].map((b, i) => ({ ...b, priority: i + 1 }))
    updatePushTiming('topicBuckets', next)
  }

  const removeBucket = (idx) => {
    const next = buckets.filter((_, i) => i !== idx).map((b, i) => ({ ...b, priority: i + 1 }))
    updatePushTiming('topicBuckets', next)
  }

  const moveBucket = (idx, dir) => {
    const next = [...buckets]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    // 不允许将非兜底桶移到最后，也不允许将兜底桶移走
    const isDefault = next[idx].priority === 99 || idx === next.length - 1
    const targetIsDefault = next[target].priority === 99 || target === next.length - 1
    if (isDefault || targetIsDefault) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    next.forEach((b, i) => { b.priority = i + 1 })
    updatePushTiming('topicBuckets', next)
  }

  return (
    <div>
      {/* Topic 选择器 */}
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

      {/* 个性化开关 */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Switch checked={personalized} onChange={handlePersonalizedChange} />
        <Text>启用个性化内容</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          开启后可为不同用户群体配置差异化消息
        </Text>
      </div>

      {/* 分桶配置 */}
      {personalized && (
        <div>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>内容分桶（按优先级从上到下依次匹配）</Text>
            <Button size="small" icon={<PlusOutlined />} onClick={addBucket}>
              添加分桶
            </Button>
          </div>

          {buckets.map((bucket, idx) => {
            const isDefault = idx === buckets.length - 1
            return (
              <BucketCard
                key={bucket.bucket_id}
                bucket={bucket}
                index={idx}
                total={buckets.length}
                isDefault={isDefault}
                onChange={updated => updateBucket(idx, updated)}
                onMoveUp={() => moveBucket(idx, -1)}
                onMoveDown={() => moveBucket(idx, 1)}
                onRemove={() => removeBucket(idx)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TopicForm
