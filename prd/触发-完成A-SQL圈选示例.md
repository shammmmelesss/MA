# 触发-完成A — SQL 圈选示例

> 数据库：PostgreSQL 16  
> 关联表：`player_base`（现有）、`event_log`（设计如下）

---

## 一、前置表结构

### 1.1 事件日志表 `event_log`

```sql
CREATE TABLE event_log (
    id             BIGSERIAL PRIMARY KEY,
    project_id     BIGINT       NOT NULL,
    account_id     VARCHAR(64)  NOT NULL,          -- 用户标识，关联 player_base.account_id
    event_name     VARCHAR(128) NOT NULL,           -- 事件名称，如 purchase / login
    properties     JSONB        NOT NULL DEFAULT '{}', -- 事件属性，任意 KV
    occurred_at    TIMESTAMPTZ  NOT NULL,           -- 事件发生时间（客户端上报）
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 常用索引
CREATE INDEX idx_event_log_account    ON event_log (project_id, account_id, event_name);
CREATE INDEX idx_event_log_occurred   ON event_log (project_id, event_name, occurred_at);
CREATE INDEX idx_event_log_properties ON event_log USING GIN (properties);
```

### 1.2 推送任务触发记录表 `push_task_trigger_log`（去重/频次控制用）

```sql
CREATE TABLE push_task_trigger_log (
    id          BIGSERIAL PRIMARY KEY,
    task_id     BIGINT      NOT NULL,
    account_id  VARCHAR(64) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trigger_log_task_account ON push_task_trigger_log (task_id, account_id, triggered_at);
```

---

## 二、核心圈选逻辑说明

「触发-完成 A」的圈选目标：
**在起止时间内，满足 A 事件条件（计数类型 + 运算符 + 计数值 + 字段过滤）的用户。**

圈选维度对应 triggerA 配置字段：

| 配置字段 | SQL 实现方式 |
|---------|-------------|
| startDate / endDate | `occurred_at BETWEEN` |
| eventName | `event_name = ?` |
| countType | 聚合函数 COUNT / MIN(occurred_at) / MAX(occurred_at) |
| countOperator / countValue | HAVING 子句 |
| filters | `properties->>'field' 运算符 值` |
| eventLogic (AND/OR) | 多事件子查询 INTERSECT / UNION |
| frequencyEnabled | 与 push_task_trigger_log 做 LEFT JOIN 去重 |

---

## 三、场景示例

### 场景 1：完成购买 ≥ 1 次（最简单）

**配置**
```
事件A: purchase（完成购买）
计数类型: total_count
计数运算符: >=
计数值: 1
起止时间: 2026-06-01 ~ 2026-06-30
```

**SQL**
```sql
SELECT DISTINCT
    pb.account_id,
    pb.player_id
FROM player_base pb
WHERE pb.project_id = :project_id
  AND pb.status = 1
  AND EXISTS (
      SELECT 1
      FROM event_log el
      WHERE el.project_id  = pb.project_id
        AND el.account_id  = pb.account_id
        AND el.event_name  = 'purchase'
        AND el.occurred_at >= '2026-06-01 00:00:00+08'
        AND el.occurred_at <  '2026-07-01 00:00:00+08'
      GROUP BY el.account_id
      HAVING COUNT(*) >= 1
  );
```

---

### 场景 2：完成购买 ≥ 3 次（总次数阈值）

**配置**
```
事件A: purchase
计数类型: total_count，>= 3
起止时间: 2026-06-01 ~ 2026-06-30
```

**SQL**
```sql
SELECT pb.account_id, pb.player_id
FROM player_base pb
WHERE pb.project_id = :project_id
  AND pb.status = 1
  AND (
      SELECT COUNT(*)
      FROM event_log el
      WHERE el.project_id  = pb.project_id
        AND el.account_id  = pb.account_id
        AND el.event_name  = 'purchase'
        AND el.occurred_at >= '2026-06-01 00:00:00+08'
        AND el.occurred_at <  '2026-07-01 00:00:00+08'
  ) >= 3;
```

---

### 场景 3：首次完成新手引导（first_time，计数类型特殊处理）

**配置**
```
事件A: tutorial_complete（完成新手引导）
计数类型: first_time
起止时间: 2026-06-01 ~ 2026-06-30
```

> `first_time` 的含义：用户**历史上第一次**触发该事件发生在起止时间范围内。

**SQL**
```sql
SELECT pb.account_id, pb.player_id
FROM player_base pb
WHERE pb.project_id = :project_id
  AND pb.status = 1
  AND EXISTS (
      -- 该用户在时间范围内有过该事件
      SELECT 1
      FROM event_log el
      WHERE el.project_id = pb.project_id
        AND el.account_id = pb.account_id
        AND el.event_name = 'tutorial_complete'
        AND el.occurred_at >= '2026-06-01 00:00:00+08'
        AND el.occurred_at <  '2026-07-01 00:00:00+08'
  )
  AND (
      -- 该用户的第一次事件就在时间范围内（不存在更早的事件）
      SELECT MIN(el2.occurred_at)
      FROM event_log el2
      WHERE el2.project_id = pb.project_id
        AND el2.account_id = pb.account_id
        AND el2.event_name = 'tutorial_complete'
  ) >= '2026-06-01 00:00:00+08';
```

---

### 场景 4：最近一次登录在指定时间范围内（last_time）

**配置**
```
事件A: login（用户登录）
计数类型: last_time
起止时间: 2026-06-20 ~ 2026-06-30
```

> `last_time` 的含义：用户**最近一次**触发该事件发生在起止时间范围内。

**SQL**
```sql
SELECT pb.account_id, pb.player_id
FROM player_base pb
WHERE pb.project_id = :project_id
  AND pb.status = 1
  AND (
      SELECT MAX(el.occurred_at)
      FROM event_log el
      WHERE el.project_id = pb.project_id
        AND el.account_id = pb.account_id
        AND el.event_name = 'login'
  ) BETWEEN '2026-06-20 00:00:00+08' AND '2026-06-30 23:59:59+08';
```

---

### 场景 5：完成购买且订单金额 >= 100（事件属性过滤）

**配置**
```
事件A: purchase
计数类型: total_count，>= 1
过滤条件: amount >= 100
起止时间: 2026-06-01 ~ 2026-06-30
```

**SQL**
```sql
SELECT DISTINCT pb.account_id, pb.player_id
FROM player_base pb
WHERE pb.project_id = :project_id
  AND pb.status = 1
  AND EXISTS (
      SELECT 1
      FROM event_log el
      WHERE el.project_id       = pb.project_id
        AND el.account_id       = pb.account_id
        AND el.event_name       = 'purchase'
        AND el.occurred_at     >= '2026-06-01 00:00:00+08'
        AND el.occurred_at      < '2026-07-01 00:00:00+08'
        AND (el.properties->>'amount')::NUMERIC >= 100
  );
```

**多个过滤条件（AND）**
```sql
-- 条件：amount >= 100 AND payment_method = 'alipay'
AND (el.properties->>'amount')::NUMERIC >= 100
AND el.properties->>'payment_method' = 'alipay'
```

**有值 / 无值判断（has_value / no_value）**
```sql
-- has_value: coupon_id 字段存在且不为 null
AND el.properties ? 'coupon_id'
AND el.properties->>'coupon_id' IS NOT NULL

-- no_value: coupon_id 字段不存在或为 null
AND (NOT (el.properties ? 'coupon_id') OR el.properties->>'coupon_id' IS NULL)
```

---

### 场景 6：多事件组合 AND（7 自然日内完成登录 AND 购买）

**配置**
```
事件A1: login（用户登录）
事件A2: purchase（完成购买）
事件逻辑: AND
时间窗口: 7 自然日
起止时间: 2026-06-01 ~ 2026-06-30
```

**SQL**
```sql
-- 找出在任意连续 7 自然日窗口内同时完成了 login 和 purchase 的用户
WITH login_events AS (
    SELECT project_id, account_id, occurred_at::DATE AS event_date
    FROM event_log
    WHERE project_id = :project_id
      AND event_name = 'login'
      AND occurred_at >= '2026-06-01 00:00:00+08'
      AND occurred_at <  '2026-07-01 00:00:00+08'
),
purchase_events AS (
    SELECT project_id, account_id, occurred_at::DATE AS event_date
    FROM event_log
    WHERE project_id = :project_id
      AND event_name = 'purchase'
      AND occurred_at >= '2026-06-01 00:00:00+08'
      AND occurred_at <  '2026-07-01 00:00:00+08'
)
SELECT DISTINCT pb.account_id, pb.player_id
FROM player_base pb
WHERE pb.project_id = :project_id
  AND pb.status = 1
  AND EXISTS (
      -- 找到一个锚点日期，使得 [anchor, anchor+6] 7天内两个事件都发生过
      SELECT 1
      FROM login_events le
      JOIN purchase_events pe
        ON pe.project_id = le.project_id
       AND pe.account_id = le.account_id
       AND pe.event_date BETWEEN le.event_date AND le.event_date + INTERVAL '6 days'
      WHERE le.account_id = pb.account_id
  );
```

---

### 场景 7：多事件组合 OR（完成购买 OR 等级提升）

**配置**
```
事件A1: purchase
事件A2: level_up
事件逻辑: OR
起止时间: 2026-06-01 ~ 2026-06-30
```

**SQL**
```sql
SELECT DISTINCT pb.account_id, pb.player_id
FROM player_base pb
WHERE pb.project_id = :project_id
  AND pb.status = 1
  AND EXISTS (
      SELECT 1
      FROM event_log el
      WHERE el.project_id = pb.project_id
        AND el.account_id = pb.account_id
        AND el.event_name IN ('purchase', 'level_up')   -- OR 用 IN
        AND el.occurred_at >= '2026-06-01 00:00:00+08'
        AND el.occurred_at <  '2026-07-01 00:00:00+08'
  );
```

---

### 场景 8：参与限制去重（参与 1 次）

在圈选结果基础上，排除已触发过该任务的用户。

**SQL（追加到任意场景的 WHERE 子句末尾）**
```sql
-- 参与 1 次：排除历史上已触发过该任务的用户
AND NOT EXISTS (
    SELECT 1
    FROM push_task_trigger_log tl
    WHERE tl.task_id    = :task_id
      AND tl.account_id = pb.account_id
);
```

---

### 场景 9：参与限制（N 自然日内最多 M 次）

**配置**
```
参与多次: 7 自然日内最多参与 1 次
```

**SQL**
```sql
-- 7 自然日内已触发次数 < M
AND (
    SELECT COUNT(*)
    FROM push_task_trigger_log tl
    WHERE tl.task_id     = :task_id
      AND tl.account_id  = pb.account_id
      AND tl.triggered_at >= NOW() - INTERVAL '7 days'
) < 1;   -- M = 1
```

---

## 四、完整示例：高价值购买用户召回

**业务目标**：圈选出 6 月份完成过 3 次以上购买、单笔金额 ≥ 100、且最近 7 天未收到过该任务推送的活跃玩家。

**配置**
```
事件A: purchase
计数类型: total_count，>= 3
过滤条件: amount >= 100
起止时间: 2026-06-01 ~ 2026-06-30
参与限制: 7 自然日内最多 1 次
任务ID: 42
项目ID: 1001
```

**SQL**
```sql
SELECT
    pb.account_id,
    pb.player_id,
    pb.role_name,
    pb.level,
    pb.vip_level,
    purchase_stats.purchase_count,
    purchase_stats.total_amount
FROM player_base pb
INNER JOIN (
    SELECT
        el.account_id,
        COUNT(*)                                  AS purchase_count,
        SUM((el.properties->>'amount')::NUMERIC)  AS total_amount
    FROM event_log el
    WHERE el.project_id  = 1001
      AND el.event_name  = 'purchase'
      AND el.occurred_at >= '2026-06-01 00:00:00+08'
      AND el.occurred_at <  '2026-07-01 00:00:00+08'
      AND (el.properties->>'amount')::NUMERIC >= 100
    GROUP BY el.account_id
    HAVING COUNT(*) >= 3
) AS purchase_stats ON purchase_stats.account_id = pb.account_id
WHERE pb.project_id = 1001
  AND pb.status     = 1
  -- 参与限制：7 自然日内未触发过该任务
  AND (
      SELECT COUNT(*)
      FROM push_task_trigger_log tl
      WHERE tl.task_id     = 42
        AND tl.account_id  = pb.account_id
        AND tl.triggered_at >= NOW() - INTERVAL '7 days'
  ) < 1
ORDER BY purchase_stats.total_amount DESC;
```

---

## 五、运算符与 countType 对照速查

### countType 对应聚合写法

| countType | 含义 | SQL 聚合 |
|-----------|------|---------|
| `total_count` | 在时间范围内的总触发次数 | `COUNT(*)` |
| `first_time` | 历史上第一次触发时间落在时间范围内 | `MIN(occurred_at)` |
| `last_time` | 最近一次触发时间落在时间范围内 | `MAX(occurred_at)` |

### countOperator 对应 SQL 运算符

| countOperator | SQL |
|--------------|-----|
| `>=` | `>= N` |
| `>` | `> N` |
| `=` | `= N` |
| `<=` | `<= N` |
| `<` | `< N` |

### 事件属性过滤运算符

| 前端 operator | SQL 写法 |
|-------------|---------|
| `=` | `properties->>'field' = 'value'` |
| `!=` | `properties->>'field' != 'value'` |
| `>` | `(properties->>'field')::NUMERIC > value` |
| `>=` | `(properties->>'field')::NUMERIC >= value` |
| `<` | `(properties->>'field')::NUMERIC < value` |
| `<=` | `(properties->>'field')::NUMERIC <= value` |
| `has_value` | `properties ? 'field' AND properties->>'field' IS NOT NULL` |
| `no_value` | `NOT (properties ? 'field') OR properties->>'field' IS NULL` |
