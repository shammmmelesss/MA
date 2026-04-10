import { describe, it, expect } from 'vitest'
import {
  validateScheduleOnce,
  validateScheduleRepeat,
  validateTriggerA,
  validateTriggerAB,
  validateTopic,
  validateStep0,
} from '../useTaskForm'

describe('validateScheduleOnce', () => {
  it('returns errors when date and time are empty', () => {
    const state = { scheduleOnce: { date: '', time: '' } }
    const errors = validateScheduleOnce(state)
    expect(errors).toHaveLength(2)
    expect(errors[0].field).toBe('scheduleOnce.date')
    expect(errors[1].field).toBe('scheduleOnce.time')
  })

  it('returns no errors when date and time are provided', () => {
    const state = { scheduleOnce: { date: '2030-01-01', time: '10:00' } }
    expect(validateScheduleOnce(state)).toHaveLength(0)
  })

  it('returns error when only date is missing', () => {
    const state = { scheduleOnce: { date: '', time: '10:00' } }
    const errors = validateScheduleOnce(state)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('scheduleOnce.date')
  })

  it('returns error when only time is missing', () => {
    const state = { scheduleOnce: { date: '2030-06-15', time: '' } }
    const errors = validateScheduleOnce(state)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('scheduleOnce.time')
  })
})

describe('validateScheduleRepeat', () => {
  it('returns error when cycle is empty', () => {
    const state = { scheduleRepeat: { cycle: '', weekDays: [], monthDays: [], time: '' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.field === 'scheduleRepeat.cycle')).toBe(true)
    expect(errors.some(e => e.message === '请选择重复周期')).toBe(true)
  })

  it('returns error when weekly but no days selected', () => {
    const state = { scheduleRepeat: { cycle: 'weekly', weekDays: [], monthDays: [], time: '10:00' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.field === 'scheduleRepeat.weekDays')).toBe(true)
    expect(errors.some(e => e.message === '请至少选择一个重复日期')).toBe(true)
  })

  it('returns error when monthly but no days selected', () => {
    const state = { scheduleRepeat: { cycle: 'monthly', weekDays: [], monthDays: [], time: '10:00' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.field === 'scheduleRepeat.monthDays')).toBe(true)
  })

  it('returns no errors for valid daily config', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '10:00' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  it('returns no errors for valid weekly config', () => {
    const state = { scheduleRepeat: { cycle: 'weekly', weekDays: [1, 3], monthDays: [], time: '10:00' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  it('returns no errors for valid monthly config', () => {
    const state = { scheduleRepeat: { cycle: 'monthly', weekDays: [], monthDays: [1, 15, 31], time: '08:30' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  it('returns error when time is missing', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.field === 'scheduleRepeat.time')).toBe(true)
  })

  // Req 6.6: time format validation
  it('returns error when time format is invalid (25:00)', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '25:00' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.message === '请输入合法时间（hh:mm）')).toBe(true)
  })

  it('returns error for time format 12:60', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '12:60' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.message === '请输入合法时间（hh:mm）')).toBe(true)
  })

  it('returns error for time format with letters', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: 'ab:cd' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.message === '请输入合法时间（hh:mm）')).toBe(true)
  })

  it('returns error for single-digit time format 9:00', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '9:00' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.message === '请输入合法时间（hh:mm）')).toBe(true)
  })

  it('accepts boundary time 00:00', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '00:00' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  it('accepts boundary time 23:59', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '23:59' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  // Req 6.7: end date validation
  it('returns error when endDate is in the past', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '10:00', endDate: '2020-01-01' } }
    const errors = validateScheduleRepeat(state)
    expect(errors.some(e => e.field === 'scheduleRepeat.endDate')).toBe(true)
    expect(errors.some(e => e.message === '结束日期不能早于当前时间')).toBe(true)
  })

  it('returns no error when endDate is null (optional)', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '10:00', endDate: null } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  it('returns no error when endDate is in the future', () => {
    const state = { scheduleRepeat: { cycle: 'daily', weekDays: [], monthDays: [], time: '10:00', endDate: '2099-12-31' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  // Req 6.9: weekly with single day is valid
  it('accepts weekly config with a single day selected', () => {
    const state = { scheduleRepeat: { cycle: 'weekly', weekDays: [5], monthDays: [], time: '14:00' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })

  // Req 6.9: monthly with single day is valid
  it('accepts monthly config with a single day selected', () => {
    const state = { scheduleRepeat: { cycle: 'monthly', weekDays: [], monthDays: [28], time: '09:00' } }
    expect(validateScheduleRepeat(state)).toHaveLength(0)
  })
})

describe('validateTriggerA', () => {
  const baseTriggerA = {
    startDate: '2030-01-01',
    endDate: '2030-01-31',
    events: [{ id: '1', eventName: 'login', filters: [] }],
    globalFilters: [],
    deliveryTiming: 'immediate',
    delayValue: 1,
    delayUnit: 'minutes',
    frequencyEnabled: false,
    frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
  }

  it('returns no errors for valid config', () => {
    expect(validateTriggerA({ triggerA: baseTriggerA })).toHaveLength(0)
  })

  // Req 7.8: at least one event required
  it('returns error when date range is missing', () => {
    const state = { triggerA: { ...baseTriggerA, startDate: '', endDate: '' } }
    const errors = validateTriggerA(state)
    expect(errors.some(e => e.field === 'triggerA.dateRange')).toBe(true)
  })

  it('returns error when only startDate is missing', () => {
    const state = { triggerA: { ...baseTriggerA, startDate: '' } }
    const errors = validateTriggerA(state)
    expect(errors.some(e => e.field === 'triggerA.dateRange')).toBe(true)
  })

  it('returns error when only endDate is missing', () => {
    const state = { triggerA: { ...baseTriggerA, endDate: '' } }
    const errors = validateTriggerA(state)
    expect(errors.some(e => e.field === 'triggerA.dateRange')).toBe(true)
  })

  // Req 7.9: start date must not be after end date
  it('returns error when start date is after end date', () => {
    const state = { triggerA: { ...baseTriggerA, startDate: '2030-02-01', endDate: '2030-01-01' } }
    const errors = validateTriggerA(state)
    expect(errors.some(e => e.message === '开始日期不能晚于结束日期')).toBe(true)
  })

  it('accepts when start date equals end date', () => {
    const state = { triggerA: { ...baseTriggerA, startDate: '2030-06-15', endDate: '2030-06-15' } }
    expect(validateTriggerA(state)).toHaveLength(0)
  })

  // Req 7.8: no events with names
  it('returns error when no events have names', () => {
    const state = { triggerA: { ...baseTriggerA, events: [{ id: '1', eventName: '', filters: [] }] } }
    const errors = validateTriggerA(state)
    expect(errors.some(e => e.field === 'triggerA.events')).toBe(true)
    expect(errors.some(e => e.message === '请至少添加一个完成事件')).toBe(true)
  })

  it('returns error when events array is empty', () => {
    const state = { triggerA: { ...baseTriggerA, events: [] } }
    const errors = validateTriggerA(state)
    expect(errors.some(e => e.field === 'triggerA.events')).toBe(true)
  })

  it('passes when at least one event has a name among multiple', () => {
    const state = {
      triggerA: {
        ...baseTriggerA,
        events: [
          { id: '1', eventName: '', filters: [] },
          { id: '2', eventName: 'purchase', filters: [] },
        ],
      },
    }
    expect(validateTriggerA(state)).toHaveLength(0)
  })

  // Req 7.10: frequency value cannot be 0
  it('returns error when frequency enabled but all zeros', () => {
    const state = { triggerA: { ...baseTriggerA, frequencyEnabled: true } }
    const errors = validateTriggerA(state)
    expect(errors.some(e => e.field === 'triggerA.frequency')).toBe(true)
    expect(errors.some(e => e.message === '推送次数不能为0')).toBe(true)
  })

  it('returns no frequency error when frequency has non-zero daily value', () => {
    const state = {
      triggerA: {
        ...baseTriggerA,
        frequencyEnabled: true,
        frequency: { daily: 5, weekly: 0, monthly: 0, intervalMinutes: 0 },
      },
    }
    expect(validateTriggerA(state)).toHaveLength(0)
  })

  it('returns no frequency error when frequency has non-zero weekly value', () => {
    const state = {
      triggerA: {
        ...baseTriggerA,
        frequencyEnabled: true,
        frequency: { daily: 0, weekly: 10, monthly: 0, intervalMinutes: 0 },
      },
    }
    expect(validateTriggerA(state)).toHaveLength(0)
  })

  it('returns no frequency error when frequency has non-zero monthly value', () => {
    const state = {
      triggerA: {
        ...baseTriggerA,
        frequencyEnabled: true,
        frequency: { daily: 0, weekly: 0, monthly: 3, intervalMinutes: 0 },
      },
    }
    expect(validateTriggerA(state)).toHaveLength(0)
  })

  it('does not validate frequency when frequencyEnabled is false', () => {
    const state = {
      triggerA: {
        ...baseTriggerA,
        frequencyEnabled: false,
        frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
      },
    }
    expect(validateTriggerA(state)).toHaveLength(0)
  })

  it('can return multiple errors simultaneously', () => {
    const state = {
      triggerA: {
        ...baseTriggerA,
        startDate: '',
        endDate: '',
        events: [],
        frequencyEnabled: true,
        frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
      },
    }
    const errors = validateTriggerA(state)
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validateTriggerAB', () => {
  const baseTriggerAB = {
    startDate: '2030-01-01',
    endDate: '2030-01-31',
    events: [{ id: '1', eventName: 'login', filters: [] }],
    globalFilters: [],
    deliveryTiming: 'immediate',
    delayValue: 1,
    delayUnit: 'minutes',
    frequencyEnabled: false,
    frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
    bEvent: 'purchase',
    timeWindow: 24,
    timeWindowUnit: 'hours',
  }

  it('returns no errors for valid config', () => {
    expect(validateTriggerAB({ triggerAB: baseTriggerAB })).toHaveLength(0)
  })

  // Req 8.3: B event is required
  it('returns error when bEvent is missing', () => {
    const state = { triggerAB: { ...baseTriggerAB, bEvent: '' } }
    const errors = validateTriggerAB(state)
    expect(errors.some(e => e.field === 'triggerAB.bEvent')).toBe(true)
    expect(errors.some(e => e.message === '请选择B事件')).toBe(true)
  })

  // Req 8.3: time window is required
  it('returns error when timeWindow is 0', () => {
    const state = { triggerAB: { ...baseTriggerAB, timeWindow: 0 } }
    const errors = validateTriggerAB(state)
    expect(errors.some(e => e.field === 'triggerAB.timeWindow')).toBe(true)
    expect(errors.some(e => e.message === '请配置时间窗口')).toBe(true)
  })

  it('returns errors for both bEvent and timeWindow missing', () => {
    const state = { triggerAB: { ...baseTriggerAB, bEvent: '', timeWindow: 0 } }
    const errors = validateTriggerAB(state)
    expect(errors.some(e => e.field === 'triggerAB.bEvent')).toBe(true)
    expect(errors.some(e => e.field === 'triggerAB.timeWindow')).toBe(true)
  })

  it('inherits triggerA validation - returns error when events are empty', () => {
    const state = { triggerAB: { ...baseTriggerAB, events: [] } }
    const errors = validateTriggerAB(state)
    expect(errors.some(e => e.field === 'triggerA.events')).toBe(true)
  })

  it('inherits triggerA validation - returns error when date range is invalid', () => {
    const state = { triggerAB: { ...baseTriggerAB, startDate: '2030-03-01', endDate: '2030-01-01' } }
    const errors = validateTriggerAB(state)
    expect(errors.some(e => e.message === '开始日期不能晚于结束日期')).toBe(true)
  })

  it('inherits triggerA validation - returns frequency error when enabled with zeros', () => {
    const state = {
      triggerAB: {
        ...baseTriggerAB,
        frequencyEnabled: true,
        frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
      },
    }
    const errors = validateTriggerAB(state)
    expect(errors.some(e => e.field === 'triggerA.frequency')).toBe(true)
  })
})

describe('validateTopic', () => {
  // Req 9.3: topic is required
  it('returns error when topic is empty', () => {
    const errors = validateTopic({ topic: '' })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('topic')
    expect(errors[0].message).toBe('请选择 topic')
  })

  it('returns no errors when topic is selected', () => {
    expect(validateTopic({ topic: 'news' })).toHaveLength(0)
  })

  it('returns no errors for any non-empty topic string', () => {
    expect(validateTopic({ topic: 'promotions' })).toHaveLength(0)
  })
})

describe('validateStep0 dispatches to correct validator', () => {
  it('dispatches to schedule_once validator', () => {
    const state = { pushType: 'schedule_once', scheduleOnce: { date: '', time: '' } }
    const errors = validateStep0(state)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.every(e => e.field.startsWith('scheduleOnce'))).toBe(true)
  })

  it('dispatches to schedule_repeat validator', () => {
    const state = { pushType: 'schedule_repeat', scheduleRepeat: { cycle: '', weekDays: [], monthDays: [], time: '' } }
    const errors = validateStep0(state)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.field.startsWith('scheduleRepeat'))).toBe(true)
  })

  it('dispatches to trigger_a validator', () => {
    const state = {
      pushType: 'trigger_a',
      triggerA: {
        startDate: '', endDate: '',
        events: [], globalFilters: [],
        deliveryTiming: 'immediate', delayValue: 1, delayUnit: 'minutes',
        frequencyEnabled: false,
        frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
      },
    }
    const errors = validateStep0(state)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('dispatches to trigger_ab validator', () => {
    const state = {
      pushType: 'trigger_ab',
      triggerAB: {
        startDate: '2030-01-01', endDate: '2030-01-31',
        events: [{ id: '1', eventName: 'login', filters: [] }],
        globalFilters: [],
        deliveryTiming: 'immediate', delayValue: 1, delayUnit: 'minutes',
        frequencyEnabled: false,
        frequency: { daily: 0, weekly: 0, monthly: 0, intervalMinutes: 0 },
        bEvent: '', timeWindow: 0, timeWindowUnit: 'hours',
      },
    }
    const errors = validateStep0(state)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('dispatches to topic validator', () => {
    const state = { pushType: 'topic', topic: '' }
    expect(validateStep0(state).length).toBeGreaterThan(0)
  })

  it('returns no errors for valid schedule_once', () => {
    const state = { pushType: 'schedule_once', scheduleOnce: { date: '2030-06-01', time: '12:00' } }
    expect(validateStep0(state)).toHaveLength(0)
  })

  it('returns no errors for valid topic', () => {
    const state = { pushType: 'topic', topic: 'updates' }
    expect(validateStep0(state)).toHaveLength(0)
  })

  it('returns empty array for unknown push type', () => {
    expect(validateStep0({ pushType: 'unknown' })).toHaveLength(0)
  })
})
