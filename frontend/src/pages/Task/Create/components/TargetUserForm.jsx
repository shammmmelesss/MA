import React, { useState, useMemo } from 'react'
import { Button, Typography, Alert, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTaskFormContext } from '../hooks/useTaskForm'
import { estimateUsers } from '../api'
import AttributeFilterRow from './AttributeFilterRow'
import { getFieldMeta } from './FieldSelector'

const { Text } = Typography

function getProjectId() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('project_id')
  if (fromUrl) return Number(fromUrl)
  const saved = localStorage.getItem('currentProjectId')
  return saved ? Number(saved) : null
}

function detectConflicts(filters) {
  const grouped = {}
  for (const f of filters) {
    if (!f.field || !f.value) continue
    if (!grouped[f.field]) grouped[f.field] = []
    grouped[f.field].push(f)
  }
  for (const field of Object.keys(grouped)) {
    const items = grouped[field]
    const eqValues = items.filter(i => i.operator === '=').map(i => i.value)
    if (eqValues.length > 1) {
      const connected = items.filter(i => i.operator === '=')
      const allAnd = connected.every(i => i.logic === 'and')
      if (allAnd) {
        const unique = new Set(eqValues)
        if (unique.size > 1) return true
      }
    }
  }
  return false
}

/* Logic toggle tag on the vertical line */
function LogicTag({ logic, onClick }) {
  return (
    <span onClick={onClick} style={{
      position: 'absolute',
      left: 2,
      top: '50%',
      transform: 'translateY(-50%)',
      padding: '2px 6px',
      border: '1px solid #1677ff',
      borderRadius: 4,
      color: '#1677ff',
      fontSize: 12,
      cursor: 'pointer',
      userSelect: 'none',
      lineHeight: '20px',
      background: '#fff',
      zIndex: 1,
    }}>
      {logic === 'and' ? '且' : '或'}
    </span>
  )
}

/* Vertical line for grouping */
function GroupLine() {
  return (
    <div style={{
      position: 'absolute',
      left: 14,
      top: 20,
      bottom: 20,
      width: 1,
      background: '#d9d9d9',
    }} />
  )
}

function TargetUserForm() {
  const {
    state, addAttributeFilter, removeAttributeFilter,
    addChildFilter, removeChildFilter, updateTargetUser,
  } = useTaskFormContext()
  const { attributeFilters } = state

  const [estimatedCount, setEstimatedCount] = useState(null)
  const [estimating, setEstimating] = useState(false)

  const hasConflict = useMemo(() => detectConflicts(attributeFilters), [attributeFilters])

  const handleFilterChange = (id, field, value) => {
    const updated = attributeFilters.map(f => {
      if (f.id !== id) return f
      const changes = { [field]: value }
      if (field === 'field') {
        const newMeta = getFieldMeta(value)
        changes.operator = newMeta?.dataType === 'segment' ? 'in_segment' : '='
        changes.value = ''
      }
      return { ...f, ...changes }
    })
    updateTargetUser('attributeFilters', updated)
  }

  const handleChildChange = (parentId, childId, field, value) => {
    const updated = attributeFilters.map(f => {
      if (f.id !== parentId) return f
      return {
        ...f,
        children: (f.children || []).map(c => {
          if (c.id !== childId) return c
          const changes = { [field]: value }
          if (field === 'field') {
            const newMeta = getFieldMeta(value)
            changes.operator = newMeta?.dataType === 'segment' ? 'in_segment' : '='
            changes.value = ''
          }
          return { ...c, ...changes }
        }),
      }
    })
    updateTargetUser('attributeFilters', updated)
  }

  /* Toggle outer (level-1) logic for all rows */
  const handleOuterLogicToggle = () => {
    const currentLogic = attributeFilters[1]?.logic || 'and'
    const newLogic = currentLogic === 'and' ? 'or' : 'and'
    const updated = attributeFilters.map((f, idx) =>
      idx === 0 ? f : { ...f, logic: newLogic }
    )
    updateTargetUser('attributeFilters', updated)
  }

  /* Toggle inner (level-2) logic for all children of a parent */
  const handleInnerLogicToggle = (parentId) => {
    const updated = attributeFilters.map(f => {
      if (f.id !== parentId || !f.children?.length) return f
      const cur = f.children[0]?.logic || 'and'
      const next = cur === 'and' ? 'or' : 'and'
      return { ...f, children: f.children.map(c => ({ ...c, logic: next })) }
    })
    updateTargetUser('attributeFilters', updated)
  }

  const handleEstimate = async () => {
    setEstimating(true)
    setEstimatedCount(null)
    try {
      const projectId = getProjectId()
      if (!projectId) {
        message.warning('未选择项目，请先选择项目空间')
        setEstimating(false)
        return
      }
      const params = {
        project_id: projectId,
        filters: attributeFilters
          .filter(f => f.field && f.value)
          .map(f => ({
            field: f.field, operator: f.operator, value: f.value, logic: f.logic,
            children: (f.children || []).filter(c => c.field && c.value).map(c => ({
              field: c.field, operator: c.operator, value: c.value, logic: c.logic,
            })),
          })),
      }
      const res = await estimateUsers(params)
      setEstimatedCount(res.estimated_count)
    } catch {
      message.error('网络异常，请重试')
    } finally {
      setEstimating(false)
    }
  }

  return (
    <div style={{ fontSize: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <label style={{ fontSize: 14, color: '#262626', fontWeight: 'normal' }}>用户属性</label>
        <Text
          style={{ fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#1677ff', marginLeft: 15 }}
          onClick={addAttributeFilter}
        >
          <PlusOutlined style={{ color: '#1677ff' }} /> 添加属性
        </Text>
      </div>

      {attributeFilters.length === 0 && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 14 }}>
          未添加筛选条件，将默认推送全量用户
        </Text>
      )}

      {hasConflict && (
        <Alert type="warning" message="筛选条件逻辑冲突，请修改" showIcon style={{ marginBottom: 16, fontSize: 14 }} />
      )}

      {/* Filter rows with outer vertical line */}
      <div style={{ marginBottom: 20, position: 'relative', paddingLeft: attributeFilters.length > 1 ? 40 : 0 }}>
        {attributeFilters.length > 1 && (
          <>
            <GroupLine />
            <LogicTag logic={attributeFilters[1]?.logic || 'and'} onClick={handleOuterLogicToggle} />
          </>
        )}

        {attributeFilters.map((filter) => {
          const children = filter.children || []
          const hasChildren = children.length > 0

          return (
            <div key={filter.id} style={{ marginBottom: 4 }}>
              {/* Parent row */}
              <AttributeFilterRow
                filter={filter}
                showLogic={false}
                showAdd
                onChange={(field, value) => handleFilterChange(filter.id, field, value)}
                onRemove={() => removeAttributeFilter(filter.id)}
                onAdd={() => addChildFilter(filter.id)}
              />

              {/* Children rows with inner vertical line */}
              {hasChildren && (
                <div style={{ position: 'relative', paddingLeft: 40, marginTop: 4, marginBottom: 8 }}>
                  <GroupLine />
                  <LogicTag logic={children[0]?.logic || 'and'} onClick={() => handleInnerLogicToggle(filter.id)} />

                  {children.map((child) => (
                    <AttributeFilterRow
                      key={child.id}
                      filter={child}
                      showLogic={false}
                      onChange={(field, value) => handleChildChange(filter.id, child.id, field, value)}
                      onRemove={() => removeChildFilter(filter.id, child.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ paddingTop: 20 }}>
        <Button type="primary" onClick={handleEstimate} loading={estimating} style={{ fontSize: 14, height: 36 }}>
          {estimating ? '计算中...' : '预估人数'}
        </Button>
        {estimatedCount !== null && (
          <Text style={{ marginLeft: 16, fontSize: 14 }}>
            预估用户数：<Text strong style={{ fontSize: 16 }}>{estimatedCount.toLocaleString()}</Text>
          </Text>
        )}
      </div>
    </div>
  )
}

export default TargetUserForm
