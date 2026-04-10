import { createContext, useContext, useState, useCallback } from 'react'

const TaskFormContext = createContext(null)

const initialState = {
  taskName: '',
  currentStep: 0,
  completedSteps: new Set(),

  // 步骤1: 推送时机
  pushType: 'schedule_once',
  scheduleOnce: { date: '', time: '' },
  scheduleRepeat: {
    cycle: '',
    weekDays: [],
    monthDays: [],
    time: '',
    startDate: null,
    endDate: null,
    frequencyEnabled: false,
    frequencyMode: 'per_cycle',     // 'per_cycle' | 'sliding' | 'rolling'
    frequencyPerCycle: 1,           // 单个周期内最多推送次数
    slidingWindowDays: 7,           // 滑动窗口天数
    slidingWindowUnit: 'day',       // 滑动窗口单位
    slidingWindowMax: 1,            // 滑动窗口内最多推送次数
    rollingUnit: 'day',             // 滚动窗口单位: day / week / month
    rollingInterval: 1,             // 滚动窗口间隔
    rollingMax: 1,                  // 滚动窗口内最多推送次数
  },
  triggerA: {
    startDate: '',
    endDate: '',
    events: [{ id: '1', eventName: '', filters: [] }],
    globalFilters: [],
    deliveryTiming: 'immediate',
    delayValue: 1,
    delayUnit: 'minutes',
    frequencyEnabled: false,
    frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
  },
  triggerAB: {
    startDate: '',
    endDate: '',
    events: [{ id: '1', eventName: '', filters: [] }],
    globalFilters: [],
    deliveryTiming: 'immediate',
    delayValue: 1,
    delayUnit: 'minutes',
    frequencyEnabled: false,
    frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
    bEvent: '',
    timeWindow: 1,
    timeWindowUnit: 'hours',
  },
  topic: '',

  // 步骤2: 目标用户
  attributeFilters: [],

  // 步骤3: 推送配置
  experimentType: 'none',
  pushStates: [
    {
      id: '1',
      contentFillMode: 'custom', // 'custom' | 'template'
      contentTemplate: '',
      copywritingGroup: '',
      sendRule: '',
      notificationTitle: '',
      notificationContent: '',
      notificationImage: { type: 'custom', url: '', material: '' },
      i18nTexts: [],  // [{ lang: 'en', title: '', content: '' }, ...]
    },
  ],
  clickAction: 'open_app',
  clickLink: '',
  style: {
    basic: 'normal',
    expandType: 'disabled',
    sound: '',
    vibrate: false,
  },
}

let filterId = 100

function generateId() {
  return String(++filterId)
}

function validateScheduleOnce(state) {
  const errors = []
  if (!state.scheduleOnce.date) errors.push({ field: 'scheduleOnce.date', message: '请选择推送日期' })
  if (!state.scheduleOnce.time) errors.push({ field: 'scheduleOnce.time', message: '请选择推送时间' })
  return errors
}

function validateScheduleRepeat(state) {
  const errors = []
  const r = state.scheduleRepeat
  if (!r.cycle) errors.push({ field: 'scheduleRepeat.cycle', message: '请选择重复周期' })
  if (r.cycle === 'weekly' && r.weekDays.length === 0) errors.push({ field: 'scheduleRepeat.weekDays', message: '请至少选择一个重复日期' })
  if (r.cycle === 'monthly' && r.monthDays.length === 0) errors.push({ field: 'scheduleRepeat.monthDays', message: '请至少选择一个重复日期' })
  if (!r.time) errors.push({ field: 'scheduleRepeat.time', message: '请选择推送时间' })
  if (r.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) errors.push({ field: 'scheduleRepeat.time', message: '请输入合法时间（hh:mm）' })
  if (r.endDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(r.endDate) < today) errors.push({ field: 'scheduleRepeat.endDate', message: '结束日期不能早于当前时间' })
  }
  return errors
}

function validateTriggerA(state) {
  const errors = []
  const t = state.triggerA
  if (!t.startDate || !t.endDate) errors.push({ field: 'triggerA.dateRange', message: '请选择生效时间范围' })
  if (t.startDate && t.endDate && t.startDate > t.endDate) errors.push({ field: 'triggerA.dateRange', message: '开始日期不能晚于结束日期' })
  if (t.events.length === 0 || t.events.every(e => !e.eventName)) errors.push({ field: 'triggerA.events', message: '请至少添加一个完成事件' })
  if (t.frequencyEnabled) {
    const f = t.frequency
    if (f.daily === 0 && f.weekly === 0 && f.monthly === 0) errors.push({ field: 'triggerA.frequency', message: '推送次数不能为0' })
  }
  return errors
}

function validateTriggerAB(state) {
  const errors = validateTriggerA({ ...state, triggerA: state.triggerAB })
  const ab = state.triggerAB
  if (!ab.bEvent) errors.push({ field: 'triggerAB.bEvent', message: '请选择B事件' })
  if (!ab.timeWindow) errors.push({ field: 'triggerAB.timeWindow', message: '请配置时间窗口' })
  return errors
}

function validateTopic(state) {
  const errors = []
  if (!state.topic) errors.push({ field: 'topic', message: '请选择 topic' })
  return errors
}

function validateStep0(state) {
  switch (state.pushType) {
    case 'schedule_once': return validateScheduleOnce(state)
    case 'schedule_repeat': return validateScheduleRepeat(state)
    case 'trigger_a': return validateTriggerA(state)
    case 'trigger_ab': return validateTriggerAB(state)
    case 'topic': return validateTopic(state)
    default: return []
  }
}

function validateStep1(_state) {
  // 目标用户无必填项，未添加筛选条件时默认全量用户
  return []
}

function validateStep2(state) {
  const errors = []
  state.pushStates.forEach((ps, idx) => {
    if (!ps.notificationTitle) errors.push({ field: `pushStates[${idx}].notificationTitle`, message: `状态 ${idx + 1}: 请输入通知标题` })
    if (!ps.notificationContent) errors.push({ field: `pushStates[${idx}].notificationContent`, message: `状态 ${idx + 1}: 请输入通知内容` })
  })
  if (state.clickAction === 'open_link' && !state.clickLink) errors.push({ field: 'clickLink', message: '请输入跳转链接' })
  return errors
}

// Exported for testing
export { validateScheduleOnce, validateScheduleRepeat, validateTriggerA, validateTriggerAB, validateTopic, validateStep0 }

export function useTaskForm() {
  const [state, setState] = useState({ ...initialState, completedSteps: new Set() })

  const setTaskName = useCallback((name) => {
    setState(prev => ({ ...prev, taskName: name }))
  }, [])

  const setCurrentStep = useCallback((step) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const markStepCompleted = useCallback((step) => {
    setState(prev => {
      const next = new Set(prev.completedSteps)
      next.add(step)
      return { ...prev, completedSteps: next }
    })
  }, [])

  const updatePushTiming = useCallback((field, value) => {
    setState(prev => {
      // Handle nested fields like "scheduleOnce.date"
      const parts = field.split('.')
      if (parts.length === 2) {
        const [parent, child] = parts
        return { ...prev, [parent]: { ...prev[parent], [child]: value } }
      }
      return { ...prev, [field]: value }
    })
  }, [])

  const updateTargetUser = useCallback((field, value) => {
    setState(prev => ({ ...prev, [field]: value }))
  }, [])

  const updatePushConfig = useCallback((field, value) => {
    setState(prev => {
      const parts = field.split('.')
      if (parts.length === 2) {
        const [parent, child] = parts
        return { ...prev, [parent]: { ...prev[parent], [child]: value } }
      }
      return { ...prev, [field]: value }
    })
  }, [])

  const addEvent = useCallback(() => {
    setState(prev => {
      const key = prev.pushType === 'trigger_ab' ? 'triggerAB' : 'triggerA'
      const current = prev[key]
      return {
        ...prev,
        [key]: {
          ...current,
          events: [...current.events, { id: generateId(), eventName: '', filters: [] }],
        },
      }
    })
  }, [])

  const removeEvent = useCallback((eventId) => {
    setState(prev => {
      const key = prev.pushType === 'trigger_ab' ? 'triggerAB' : 'triggerA'
      const current = prev[key]
      if (current.events.length <= 1) return prev
      return {
        ...prev,
        [key]: {
          ...current,
          events: current.events.filter(e => e.id !== eventId),
        },
      }
    })
  }, [])

  const addAttributeFilter = useCallback(() => {
    setState(prev => ({
      ...prev,
      attributeFilters: [
        ...prev.attributeFilters,
        { id: generateId(), field: '', operator: '=', value: '', logic: 'and', children: [] },
      ],
    }))
  }, [])

  const removeAttributeFilter = useCallback((filterId) => {
    setState(prev => ({
      ...prev,
      attributeFilters: prev.attributeFilters.filter(f => f.id !== filterId),
    }))
  }, [])

  const addChildFilter = useCallback((parentId) => {
    setState(prev => ({
      ...prev,
      attributeFilters: prev.attributeFilters.map(f =>
        f.id === parentId
          ? { ...f, children: [...(f.children || []), { id: generateId(), field: '', operator: '=', value: '', logic: 'and' }] }
          : f
      ),
    }))
  }, [])

  const removeChildFilter = useCallback((parentId, childId) => {
    setState(prev => ({
      ...prev,
      attributeFilters: prev.attributeFilters.map(f =>
        f.id === parentId
          ? { ...f, children: (f.children || []).filter(c => c.id !== childId) }
          : f
      ),
    }))
  }, [])

  const addPushState = useCallback(() => {
    setState(prev => ({
      ...prev,
      pushStates: [
        ...prev.pushStates,
        {
          id: generateId(),
          contentFillMode: 'custom',
          contentTemplate: '',
          copywritingGroup: '',
          sendRule: '',
          notificationTitle: '',
          notificationContent: '',
          notificationImage: { type: 'custom', url: '', material: '' },
          i18nTexts: [],
        },
      ],
    }))
  }, [])

  const removePushState = useCallback((stateId) => {
    setState(prev => {
      if (prev.pushStates.length <= 1) return prev
      return { ...prev, pushStates: prev.pushStates.filter(s => s.id !== stateId) }
    })
  }, [])

  const copyPushState = useCallback((stateId) => {
    setState(prev => {
      const source = prev.pushStates.find(s => s.id === stateId)
      if (!source) return prev
      const idx = prev.pushStates.findIndex(s => s.id === stateId)
      const copy = { ...source, id: generateId(), notificationImage: { ...source.notificationImage }, i18nTexts: source.i18nTexts ? source.i18nTexts.map(t => ({ ...t })) : [] }
      const next = [...prev.pushStates]
      next.splice(idx + 1, 0, copy)
      return { ...prev, pushStates: next }
    })
  }, [])

  const updatePushState = useCallback((stateId, field, value) => {
    setState(prev => ({
      ...prev,
      pushStates: prev.pushStates.map(s =>
        s.id === stateId ? { ...s, [field]: value } : s
      ),
    }))
  }, [])

  const validateCurrentStep = useCallback(() => {
    const validators = [validateStep0, validateStep1, validateStep2]
    const validator = validators[state.currentStep]
    if (!validator) return { valid: true, errors: [] }
    const errors = validator(state)
    return { valid: errors.length === 0, errors }
  }, [state])

  const resetPushTypeFields = useCallback((newType) => {
    setState(prev => ({
      ...prev,
      pushType: newType,
      scheduleOnce: initialState.scheduleOnce,
      scheduleRepeat: { ...initialState.scheduleRepeat },
      triggerA: { ...initialState.triggerA, events: [{ id: generateId(), eventName: '', filters: [] }], globalFilters: [], frequency: { ...initialState.triggerA.frequency } },
      triggerAB: { ...initialState.triggerAB, events: [{ id: generateId(), eventName: '', filters: [] }], globalFilters: [], frequency: { ...initialState.triggerAB.frequency } },
      topic: '',
    }))
  }, [])

  const getSubmitPayload = useCallback(() => {
    const buildTimingConfig = () => {
      const base = { push_type: state.pushType }
      switch (state.pushType) {
        case 'schedule_once':
          return { ...base, schedule_once: { date: state.scheduleOnce.date, time: state.scheduleOnce.time, timezone: 'user' } }
        case 'schedule_repeat':
          return { ...base, schedule_repeat: { cycle: state.scheduleRepeat.cycle, week_days: state.scheduleRepeat.weekDays, month_days: state.scheduleRepeat.monthDays, time: state.scheduleRepeat.time, end_date: state.scheduleRepeat.endDate } }
        case 'trigger_a':
          return { ...base, trigger_a: { start_date: state.triggerA.startDate, end_date: state.triggerA.endDate, events: state.triggerA.events.map(e => ({ event_name: e.eventName, filters: e.filters })), global_filters: state.triggerA.globalFilters, delivery_timing: state.triggerA.deliveryTiming, delay_value: state.triggerA.delayValue, delay_unit: state.triggerA.delayUnit, frequency_enabled: state.triggerA.frequencyEnabled, frequency: state.triggerA.frequency } }
        case 'trigger_ab': {
          const ab = state.triggerAB
          return { ...base, trigger_ab: { start_date: ab.startDate, end_date: ab.endDate, events: ab.events.map(e => ({ event_name: e.eventName, filters: e.filters })), global_filters: ab.globalFilters, delivery_timing: ab.deliveryTiming, delay_value: ab.delayValue, delay_unit: ab.delayUnit, frequency_enabled: ab.frequencyEnabled, frequency: ab.frequency, b_event: ab.bEvent, time_window: ab.timeWindow, time_window_unit: ab.timeWindowUnit } }
        }
        case 'topic':
          return { ...base, topic: state.topic }
        default:
          return base
      }
    }

    return {
      task_name: state.taskName,
      push_type: state.pushType,
      push_timing_config: buildTimingConfig(),
      target_user_config: {
        filters: state.attributeFilters.map(f => ({ field: f.field, operator: f.operator, value: f.value, logic: f.logic })),
      },
      push_content_config: {
        experiment_type: state.experimentType,
        states: state.pushStates.map(ps => ({
          content_fill_mode: ps.contentFillMode,
          template: ps.contentTemplate,
          copywriting_group: ps.copywritingGroup,
          send_rule: ps.sendRule,
          title: ps.notificationTitle,
          content: ps.notificationContent,
          image: ps.notificationImage.url ? ps.notificationImage : undefined,
        })),
        click_action: state.clickAction,
        click_link: state.clickAction === 'open_link' ? state.clickLink : undefined,
        style: { basic: state.style.basic, expand_type: state.style.expandType, sound: state.style.sound, vibrate: state.style.vibrate },
      },
    }
  }, [state])

  return {
    state,
    setTaskName,
    setCurrentStep,
    markStepCompleted,
    updatePushTiming,
    updateTargetUser,
    updatePushConfig,
    addEvent,
    removeEvent,
    addAttributeFilter,
    removeAttributeFilter,
    addChildFilter,
    removeChildFilter,
    addPushState,
    removePushState,
    copyPushState,
    updatePushState,
    validateCurrentStep,
    resetPushTypeFields,
    getSubmitPayload,
  }
}

export function TaskFormProvider({ children }) {
  const form = useTaskForm()
  return <TaskFormContext.Provider value={form}>{children}</TaskFormContext.Provider>
}

export function useTaskFormContext() {
  const ctx = useContext(TaskFormContext)
  if (!ctx) throw new Error('useTaskFormContext must be used within TaskFormProvider')
  return ctx
}

export default useTaskForm
