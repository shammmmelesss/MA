# MA — 游戏智能化营销推送系统 (Game Marketing Automation)

面向游戏运营团队的智能化营销推送平台，提供玩家画像管理、人群分群、多渠道营销活动编排与推送能力。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Go 1.23 + Gin + GORM |
| 前端 | React 18 + Ant Design + Vite |
| 数据库 | PostgreSQL |
| 缓存 | Redis |
| 推送 | FCM (Firebase Cloud Messaging) |

## 项目结构

```
Documents/trae_projects/MA_v1/
├── main.go                  # 服务入口
├── go.mod
├── internal/
│   ├── config/              # 配置加载（环境变量 + 默认值）
│   ├── model/               # 数据模型（Player, Tag, Segment, Campaign, App, Project）
│   ├── repository/          # 数据访问层（PostgreSQL）
│   ├── service/             # 业务逻辑层
│   └── handler/             # HTTP 请求处理器（Gin handlers）
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── router.jsx       # 前端路由
│   │   └── pages/           # 页面组件
│   ├── package.json
│   └── vite.config.js
└── prd/                     # 产品需求文档
```

## 核心功能模块

### 项目空间管理
多项目隔离，支持项目成员管理与权限控制。

### App 接入管理
游戏 App 接入注册、鉴权（API Key + IP 白名单）、推送渠道配置、设备管理。

### 玩家画像
- 玩家基础信息管理（等级、VIP、注册/登录时间等）
- 标签体系：标签分类、标签规则配置、标签统计
- 人群分群：基于标签组合的人群圈选与计算

### 营销活动
- 支持即时、定时、触发、A/B 测试四种活动类型
- 完整生命周期管理：草稿 → 审批 → 运行 → 暂停/完成/取消
- 多渠道内容配置（FCM、短信、微信、应用内）
- 活动执行与效果追踪

## API 概览

所有接口统一前缀 `/api/v1`：

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 项目空间 | `/projects` | 项目 CRUD、成员管理 |
| App 接入 | `/apps` | App 管理、鉴权、渠道配置、设备管理 |
| 玩家画像 | `/profile` | 玩家信息、标签管理、分群管理 |
| 营销活动 | `/campaigns` | 活动 CRUD、生命周期、内容、渠道、执行 |

## 快速开始

### 环境要求
- Go 1.23+
- Node.js 18+
- PostgreSQL 16+

### 后端启动

```bash
cd Documents/trae_projects/MA_v1

# 配置环境变量（可选，有默认值）
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=game_marketing
export SERVER_PORT=8080

# 启动服务
go run main.go
```

### 前端启动

```bash
cd Documents/trae_projects/MA_v1/frontend

npm install
npm run dev
```

前端默认运行在 `http://localhost:3000`，API 请求自动代理到后端 `http://localhost:8080`。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SERVER_PORT` | `8080` | 服务端口 |
| `DB_HOST` | `localhost` | 数据库地址 |
| `DB_PORT` | `5432` | 数据库端口 |
| `DB_NAME` | `game_marketing` | 数据库名 |
| `REDIS_HOST` | `localhost` | Redis 地址 |
| `REDIS_PORT` | `6379` | Redis 端口 |
| `FCM_PROJECT_ID` | - | Firebase 项目 ID |
| `FCM_API_KEY` | - | Firebase API Key |

## License

MIT
