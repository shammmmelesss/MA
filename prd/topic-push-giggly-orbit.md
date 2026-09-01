# Topic 个性化消息 Push 完整方案

## Context

PRD 定义：topic 推送 = 向订阅了指定 topic 的用户推送消息。
当前状态：topic 选项是纯 mock，后端无 topic 表、无订阅表、无发送逻辑，前端只有 topic 选择器。
目标：端到端实现 **Topic 创建管理 → 用户订阅 → 个性化推送** 全链路。

---

## 一、Topic 创建与管理

### 1.1 数据库表

```sql
-- topic 定义表
CREATE TABLE topic_definition (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT       NOT NULL,
    topic_key   VARCHAR(64)  NOT NULL,   -- 唯一标识，如 "promotion"
    name        VARCHAR(128) NOT NULL,   -- 展示名称
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, topic_key)
);
```

### 1.2 后端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/topics` | 列表（分页 + 项目过滤） |
| POST | `/api/v1/topics` | 创建 topic |
| PUT | `/api/v1/topics/:id` | 编辑 |
| DELETE | `/api/v1/topics/:id` | 删除（软删/is_active=false） |

**关键文件（新增）：**
- `internal/model/topic.go` — TopicDefinition struct
- `internal/repository/topic.go` — GORM CRUD
- `internal/service/topic.go` — 业务逻辑（key 唯一性校验等）
- `internal/handler/topic.go` — Gin handlers
- `main.go` — 注册路由 `/api/v1/topics`

**现有 GetTopics 改造：**
`internal/handler/push_task.go` 中 `GetTopics` 改为查 `topic_definition` 表，替换硬编码 mock。

### 1.3 前端管理页面

新增路由 `/project/:id/topics`，参考现有 `UserAttribute` 页面的列表模式。

**关键文件（新增）：**
- `frontend/src/pages/Topic/index.jsx` — topic 列表 + 增删改
- `frontend/src/router/index.jsx` — 添加路由

---

## 二、用户订阅 Topic

### 2.1 数据库表

```sql
-- 用户-topic 订阅关系表
CREATE TABLE topic_subscription (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT       NOT NULL,
    topic_id    BIGINT       NOT NULL REFERENCES topic_definition(id),
    account_id  VARCHAR(64)  NOT NULL,   -- 关联 player_base.account_id
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,         -- NULL 表示当前订阅中
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    UNIQUE (project_id, topic_id, account_id)
);

CREATE INDEX idx_topic_sub_topic ON topic_subscription (project_id, topic_id) WHERE is_active = true;
CREATE INDEX idx_topic_sub_user  ON topic_subscription (project_id, account_id) WHERE is_active = true;
```

### 2.2 订阅 API（供客户端/SDK 调用）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/topics/:key/subscribe` | 用户订阅（body: `{ account_id }` 或从 token 取） |
| POST | `/api/v1/topics/:key/unsubscribe` | 用户取消订阅 |
| GET | `/api/v1/topics/subscriptions` | 查询某用户的订阅列表 |

**关键文件（新增）：**
- `internal/repository/topic.go` — 增加 Subscribe/Unsubscribe/GetSubscribers 方法
- `internal/handler/topic.go` — 增加对应 handler

### 2.3 管理后台：查看订阅用户数

在 topic 列表页展示每个 topic 的订阅人数（`SELECT COUNT(*) FROM topic_subscription WHERE topic_id=? AND is_active=true`）。

---

## 三、给订阅用户发送个性化消息

### 3.1 个性化内容：分桶策略

topic 推送中，`push_timing_config` 结构升级（JSONB，无需加字段）：

```json
{
  "topic": "promotion",
  "personalization": true,
  "content_buckets": [
    {
      "bucket_id": "vip",
      "label": "VIP用户",
      "priority": 1,
      "user_filters": [
        { "field": "tag_vip", "operator": "=", "value": "true", "logic": "and" }
      ],
      "content": {
        "title": "尊享专属折扣 {{username}}",
        "body": "您的VIP专属优惠已到账"
      }
    },
    {
      "bucket_id": "default",
      "label": "默认（兜底）",
      "priority": 99,
      "user_filters": [],
      "content": {
        "title": "限时活动",
        "body": "精彩活动不容错过"
      }
    }
  ]
}
```

每个桶按 priority 顺序匹配，命中第一个满足条件的桶。user_filters 结构复用现有 `target_user_config` 的 filter 格式。

### 3.2 发送逻辑（后端）

**文件：`internal/service/push_task.go`**（ExecuteTopicPush 新增方法）

```
伪代码：
subscribers = SELECT account_id FROM topic_subscription 
              WHERE topic_id = ? AND is_active = true

buckets = parse push_timing_config.content_buckets (sorted by priority)

for each subscriber:
  user_attrs = SELECT * FROM player_base WHERE account_id = ?
  user_tags  = SELECT * FROM player_tag WHERE account_id = ?
  
  matched_content = buckets.last()  // 默认桶兜底
  for each bucket (by priority):
    if bucket.user_filters is empty OR matchFilters(user_attrs+tags, bucket.user_filters):
      matched_content = bucket.content
      break
  
  // 变量插值：{{username}} {{device}} {{country}} {{language}}
  title = interpolate(matched_content.title, user_attrs)
  body  = interpolate(matched_content.body,  user_attrs)
  
  send(subscriber, title, body)  // 调用推送通道（FCM/in_app 等）
```

filter 匹配逻辑复用/参考 `internal/service/push_task.go:96` 处的 EstimateUsers TODO 位置。

### 3.3 前端 UI：分桶配置

**文件修改：`frontend/src/pages/Task/Create/components/TopicForm.jsx`**

在 topic 选择器下方增加：
- "启用个性化内容"开关
- 开启后展示分桶列表，每个桶包含：
  - 用户条件（复用 `FieldSelector.jsx` 组件）
  - 消息内容（title/body/image，复用 PushConfigForm 已有子组件）
  - 上/下排序按钮
- 最后一个"默认"桶不可删除、不可添加 filter

**文件修改：`frontend/src/pages/Task/Create/hooks/useTaskForm.jsx`**

`getSubmitPayload` 中 topic 类型增加 content_buckets 序列化。

---

## 关键文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `internal/model/topic.go` | 新增 | TopicDefinition + TopicSubscription struct |
| `internal/repository/topic.go` | 新增 | GORM CRUD + Subscribe/Unsubscribe/GetSubscribers |
| `internal/service/topic.go` | 新增 | 业务逻辑（唯一性、执行推送） |
| `internal/handler/topic.go` | 新增 | Gin handlers（管理 + 订阅 API） |
| `internal/handler/push_task.go` | 修改 | GetTopics 改为查 DB |
| `internal/service/push_task.go` | 修改 | 增加 ExecuteTopicPush + matchFilters + interpolate |
| `main.go` | 修改 | 注册 `/api/v1/topics` 路由 |
| `frontend/src/pages/Topic/index.jsx` | 新增 | Topic 管理页 |
| `frontend/src/router/index.jsx` | 修改 | 添加 topic 管理路由 |
| `frontend/src/pages/Task/Create/components/TopicForm.jsx` | 修改 | 增加分桶配置 UI |
| `frontend/src/pages/Task/Create/hooks/useTaskForm.jsx` | 修改 | 序列化 content_buckets |

---

## 验证方式

1. **Topic 管理**：访问 `/project/1/topics`，创建 topic "summer_sale"，确认 GET `/api/v1/topics` 返回 DB 数据（而非 mock）
2. **订阅**：调用 `POST /api/v1/topics/summer_sale/subscribe`，确认 `topic_subscription` 表有记录
3. **创建推送任务**：选择 topic 类型，启用个性化，配置 2 个桶（VIP + 默认），保存后确认 `push_timing_config` JSONB 结构正确
4. **发送验证**：`POST /api/v1/push-tasks/test-send`，response 返回命中的 bucket_id，确认 VIP 用户走 vip 桶、普通用户走 default 桶
5. **变量插值**：VIP 桶标题含 `{{username}}`，确认发送结果中替换为用户真实名称
