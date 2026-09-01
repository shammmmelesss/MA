# PRD：推送任务 - 触发类型「触发-完成A」

## 1. 功能概述

「触发-完成 A」是一种基于用户行为事件实时触发的推送方式。当用户在指定时间范围内完成配置的 A 事件（支持多事件组合）时，系统立即或延迟对该用户进行一次推送触达。

与定时推送不同，该模式以用户个体的实际行为为驱动，具有强实时性和精准性。

---

## 2. 使用场景

- 用户完成首次下单后，立即推送「订单确认 + 优惠券」
- 用户完成注册后，延迟 10 分钟推送「新手引导」
- 用户 7 天内累计登录 3 次，触发「活跃用户专属权益」推送

---

## 3. 功能模块

### 3.1 触发规则（A 事件配置）

配置触发推送的用户行为事件条件。

#### 3.1.1 事件列表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 事件名称（eventName） | 字符串 | 是 | 从系统预设事件列表中选择 |
| 计数类型（countType） | 枚举 | 是 | `total_count`（总次数）/ `first_time`（首次）/ `last_time`（最近一次） |
| 计数运算符（countOperator） | 枚举 | 是 | `>=` / `=` / `<=` / `>` / `<` |
| 计数值（countValue） | 整数 | 是 | 默认值为 1，最小值为 1 |
| 事件过滤条件（filters） | 数组 | 否 | 见 3.1.3 |

- 支持添加多个事件，多事件之间支持 AND / OR 逻辑关系
- 至少配置 1 个有效事件（eventName 不为空）

#### 3.1.2 事件时间窗口

多事件组合时，可指定在某个时间窗口内这些事件必须全部/任一满足。

| 字段 | 类型 | 说明 |
|------|------|------|
| eventTimeWindow | 整数 | 时间窗口数值，最小 1 |
| eventTimeWindowUnit | 枚举 | `natural_day`（自然日）/ `natural_week`（自然周）/ `natural_month`（自然月） |

#### 3.1.3 事件字段过滤条件（filters）

对单个事件可附加字段级过滤。

| 字段 | 类型 | 说明 |
|------|------|------|
| 字段名 | 字符串 | 事件属性字段 |
| 运算符 | 枚举 | `=` / `!=` / `>` / `<` / `>=` / `<=` / `has_value`（有值）/ `no_value`（无值） |
| 值 | 字符串 | 比较值（`has_value` / `no_value` 时无需填写） |

---

### 3.2 触达时机

A 事件满足后，对用户进行触达的时间策略。

| 配置项 | 类型 | 说明 |
|--------|------|------|
| deliveryTiming | 枚举 | `immediate`（立即）/ `delay`（延迟） |
| delayValue | 整数 | 延迟时长，最小 1；仅当 deliveryTiming=delay 时有效 |
| delayUnit | 枚举 | `minutes`（分钟）/ `hours`（小时）/ `days`（天）；仅 delay 模式有效 |

**界面交互**：选择「延迟」后，展示延迟时长和单位输入框。

---

### 3.3 起止时间

任务的生效时间范围，仅在此范围内触发的事件才会产生推送。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | 日期（YYYY-MM-DD） | 是 | 开始日期，不能早于今天 |
| startTime | 时间（HH:mm） | 是 | 开始时间，默认 00:00 |
| endDate | 日期（YYYY-MM-DD） | 是 | 结束日期，不能早于今天 |
| endTime | 时间（HH:mm） | 是 | 结束时间，默认 00:00 |

**校验规则**：
- startDate 和 endDate 均为必填
- startDate 不能晚于 endDate（跨天校验取日期部分比较）

---

### 3.4 参与限制

控制同一用户在任务有效期内触发推送的次数上限。

| 配置项 | 说明 |
|--------|------|
| 参与 1 次 | 用户只会被触发一次（frequencyEnabled = false） |
| 参与多次 | 用户可被多次触发（frequencyEnabled = true） |

选择「参与多次」时，展示以下配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| naturalDays | 整数 | 时间窗口（自然日数），最小 1 |
| maxCount | 整数 | 窗口内最多参与次数，最小 1 |

语义：「同一个用户 **N** 自然日内，最多参与 **M** 次」

---

## 4. 表单校验规则

| 校验项 | 规则 |
|--------|------|
| 起止时间 | startDate 和 endDate 均不能为空 |
| 起止时间顺序 | startDate ≤ endDate |
| 触发事件 | 至少 1 个事件的 eventName 不为空 |
| 参与限制（多次） | naturalDays > 0，maxCount > 0 |

---

## 5. 接口数据结构（提交 Payload）

```json
{
  "push_type": "trigger_a",
  "push_timing_config": {
    "push_type": "trigger_a",
    "trigger_a": {
      "start_date": "2026-06-01",
      "start_time": "09:00",
      "end_date": "2026-06-30",
      "end_time": "23:59",
      "events": [
        {
          "event_name": "order_paid",
          "count_type": "total_count",
          "count_operator": ">=",
          "count_value": 1,
          "filters": [
            { "field": "amount", "operator": ">=", "value": "100" }
          ]
        }
      ],
      "event_logic": "and",
      "event_time_window": 7,
      "event_time_window_unit": "natural_day",
      "global_filters": [],
      "delivery_timing": "delay",
      "delay_value": 10,
      "delay_unit": "minutes",
      "frequency_enabled": true,
      "frequency": {
        "natural_days": 7,
        "max_count": 1,
        "interval_minutes": 0
      }
    }
  }
}
```

---

## 6. 交互流程

```
用户选择推送类型「触发-完成A」
    ↓
配置触发规则（A 事件 + 时间窗口）
    ↓
配置触达时机（立即 or 延迟 N 分钟/小时/天）
    ↓
配置生效起止时间
    ↓
配置参与限制（1次 or 多次）
    ↓
提交表单校验 → 进入下一步（目标用户）
```

---

## 7. 边界与限制

- 事件列表来源于后端接口 `GET /api/v1/push-tasks/events`，异步加载
- 最少配置 1 个事件，事件数量无上限
- 时间窗口仅适用于多事件组合场景；单事件时配置无实际意义但仍保留
- 延迟推送时，若任务在延迟等待期间超过 endDate，是否推送由后端策略决定（前端不做约束）
- 参与限制默认为「参与 1 次」（frequencyEnabled = false）
