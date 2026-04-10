# 实现计划：新建推送任务页面 (create-push-task)

## 概述

基于需求文档和设计文档，将「新建推送任务」功能拆分为后端数据层、后端API层、前端状态管理、前端页面组件、表单步骤组件等增量实现步骤。后端采用 Go (Gin + GORM)，前端采用 React 18 + Ant Design 5 + React Router 6。

## 任务列表

- [-] 1. 后端数据模型与仓库层
  - [x] 1.1 创建 PushTask 数据模型
    - 新建 `internal/model/push_task.go`，定义 `PushTask` 结构体
    - 包含字段：TaskID, ProjectID, TaskName, PushType, Status, PushTimingConfig(JSONB), TargetUserConfig(JSONB), PushContentConfig(JSONB), Creator, CreateTime, UpdateTime
    - 复用现有 `model.JSONB` 类型
    - _需求: 20.1, 20.2, 20.3_
  - [x] 1.2 创建 PushTask 仓库层
    - 新建 `internal/repository/push_task.go`，定义 `PushTaskRepository` 接口和实现
    - 实现方法：CreatePushTask, UpdatePushTask, GetPushTaskByID, ListPushTasks, DeletePushTask
    - 参考 `internal/repository/campaign.go` 的模式
    - _需求: 20.1, 20.2_
  - [ ]* 1.3 编写 PushTask 仓库层单元测试
    - 测试 CRUD 操作的正确性
    - _需求: 20.1_

- [x] 2. 后端服务层与 API 处理器
  - [x] 2.1 创建 PushTask 服务层
    - 新建 `internal/service/push_task.go`，定义 `PushTaskService` 接口和实现
    - 实现方法：CreateTask（校验必填字段、设置默认状态为draft）、UpdateTask、GetTaskByID、ListTasks、EstimateUsers
    - 参考 `internal/service/campaign.go` 的模式
    - _需求: 2.4, 2.5, 20.1, 12.2_
  - [x] 2.2 创建 PushTask API 处理器
    - 新建 `internal/handler/push_task.go`，定义 `PushTaskHandler` 接口和实现
    - 实现接口：POST /push-tasks（创建）、PUT /push-tasks/:taskId（更新）、GET /push-tasks/:taskId（详情）、POST /push-tasks/estimate（预估人数）
    - 实现辅助接口：GET /push-tasks/topics、GET /push-tasks/events、GET /push-tasks/templates（返回模拟数据）
    - 参考 `internal/handler/campaign.go` 的模式
    - _需求: 20.1, 12.1, 12.2, 9.1, 7.1, 14.1_
  - [x] 2.3 注册路由到 main.go
    - 在 `main.go` 中初始化 PushTask 的 repository → service → handler 链路
    - 在 `/api/v1/push-tasks` 路由组下注册所有新接口
    - _需求: 1.2_
  - [x]* 2.4 编写 PushTask 处理器单元测试
    - 测试创建、更新、获取任务的 API 响应
    - 测试无效输入和服务层错误的处理
    - _需求: 20.1, 2.4_

- [x] 3. 检查点 - 后端完成
  - 确保所有后端代码编译通过，请用户确认是否有问题。

- [x] 4. 前端状态管理与路由配置
  - [x] 4.1 创建 useTaskForm 自定义 Hook
    - 新建 `frontend/src/pages/Task/Create/hooks/useTaskForm.js`
    - 实现 TaskFormState 状态管理（taskName, currentStep, completedSteps, pushType 及各类型子表单数据, attributeFilters, 推送配置数据）
    - 实现方法：setTaskName, setCurrentStep, markStepCompleted, updatePushTiming, updateTargetUser, updatePushConfig, addEvent, removeEvent, addAttributeFilter, removeAttributeFilter, validateCurrentStep, resetPushTypeFields, getSubmitPayload
    - 使用 React Context 向子组件分发状态
    - _需求: 3.5, 4.2, 4.3, 19.1, 19.2_
  - [x] 4.2 创建 API 服务模块
    - 新建 `frontend/src/pages/Task/Create/api.js`
    - 封装 axios 调用：createTask, updateTask, getTask, estimateUsers, getTopics, getEvents, getTemplates
    - _需求: 20.1, 12.2, 9.1, 7.1, 14.1_
  - [x] 4.3 配置独立路由
    - 修改 `frontend/src/router.jsx`，在顶层路由数组中添加 `{ path: 'tasks/create', element: <CreatePushTask /> }`（与 App 路由同级，不嵌套在 App 下）
    - _需求: 1.1, 1.2_
  - [x] 4.4 修改任务列表页添加创建入口
    - 修改 `frontend/src/pages/Task/List.jsx`，将「创建任务」按钮改为使用 `useNavigate` 跳转到 `/tasks/create`
    - _需求: 1.1_

- [x] 5. 前端页面骨架与顶部操作栏
  - [x] 5.1 创建 CreatePushTask 页面根组件
    - 完善 `frontend/src/pages/Task/Create/index.jsx`，实现独立全屏布局（不含系统侧边栏和顶部导航）
    - 集成 useTaskForm Hook 和 Context Provider
    - 布局：顶部 TopBar + 下方左侧 StepNavigator + 右侧 StepContent 条件渲染
    - _需求: 1.1, 1.2, 1.3_
  - [x] 5.2 实现 TopBar 组件
    - 新建 `frontend/src/pages/Task/Create/components/TopBar.jsx`
    - 包含：返回按钮（ArrowLeftOutlined）、任务名称 Input（placeholder「请输入任务名称」）、系统管理链接、取消按钮、保存按钮
    - 返回和取消按钮点击弹出 Modal.confirm「是否放弃当前编辑？」，确认后 navigate('/tasks/list')
    - 保存按钮调用 validateCurrentStep，校验通过后调用 createTask/updateTask API，成功后 message.success('草稿保存成功')
    - 校验失败时滚动到第一个错误字段
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 5.3 实现 StepNavigator 组件
    - 新建 `frontend/src/pages/Task/Create/components/StepNavigator.jsx`
    - 垂直展示4个步骤：推送时机、目标用户、推送配置、目标设置（规划中）
    - 当前步骤蓝色高亮，已完成步骤蓝色对勾，未开始灰色，步骤4灰色不可点击
    - 点击已完成步骤可切换，点击未开始步骤无反应
    - 步骤切换时自动保存当前表单数据到 state
    - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 18.1_

- [x] 6. 检查点 - 页面骨架完成
  - 确保页面骨架可正常渲染，路由跳转正常，请用户确认是否有问题。

- [x] 7. 步骤1：推送时机表单
  - [x] 7.1 实现 PushTimingForm 主组件与推送类型选择
    - 新建 `frontend/src/pages/Task/Create/components/PushTimingForm.jsx`
    - 展示5个推送类型 Radio：定时-单次、定时-重复、触发-完成A、触发-完成A后未完成B、topic
    - 切换类型时隐藏旧控件组、显示新控件组，清空无关表单数据（调用 resetPushTypeFields）
    - _需求: 4.1, 4.2, 4.3_
  - [x] 7.2 实现定时-单次子表单 (ScheduleOnceForm)
    - 在 PushTimingForm 内实现或新建子组件
    - 包含：DatePicker（必填）、TimePicker hh:mm 24小时制（必填）、时区标签「用户时区」（Tooltip: 推送将按用户设备所在时区执行）
    - 校验：推送时间不能早于当前时间
    - _需求: 5.1, 5.2, 5.3, 5.4_
  - [x] 7.3 实现定时-重复子表单 (ScheduleRepeatForm)
    - 包含：重复周期 Select（每天/每周/每月）、动态日期选择器（每天隐藏、每周显示周一~周日 Checkbox、每月显示1~31多选）、TimePicker、时区标签、可选结束日期
    - 每月31号 Tooltip 提示「当月无对应日期时将跳过推送」
    - 校验：时间格式、结束日期不早于当前、必选重复周期、每周/每月至少选一天
    - 配置完成后展示预览文案
    - _需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_
  - [x] 7.4 实现触发-完成A子表单 (TriggerAForm) 与 EventCombinationForm
    - 包含：生效时间范围 RangePicker、EventCombinationForm（+添加事件、事件行+筛选条件、且满足全局筛选）、触达时机 Select（立即/延迟+时间输入）、频率控制开关及子表单
    - EventCombinationForm：支持添加/删除事件行（仅剩1个时禁用删除）、每行支持+筛选添加属性条件
    - 校验：至少一个事件、开始日期≤结束日期、频率值不为0
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_
  - [x] 7.5 实现触发-完成A后未完成B子表单 (TriggerABForm)
    - 继承 TriggerAForm 所有控件，额外展示 B 事件选择和时间窗口配置
    - B 事件和时间窗口为必填项
    - _需求: 8.1, 8.2, 8.3_
  - [x] 7.6 实现 topic 子表单 (TopicForm)
    - 仅展示 topic 选择下拉框（调用 GET /push-tasks/topics 获取选项），隐藏所有时间和触发配置
    - topic 为必填项
    - _需求: 9.1, 9.2, 9.3_
  - [x] 7.7 编写推送时机表单校验逻辑单元测试
    - 测试各推送类型的必填校验和边界条件
    - _需求: 5.3, 6.6, 6.7, 6.8, 6.9, 7.8, 7.9, 7.10, 8.3, 9.3_

- [x] 8. 步骤2：目标用户表单
  - [x] 8.1 实现 TargetUserForm 组件
    - 新建 `frontend/src/pages/Task/Create/components/TargetUserForm.jsx`
    - 包含：+添加属性按钮、AttributeFilterRow 动态行列表、+添加行为按钮（禁用灰色）、预估人数按钮
    - 未添加筛选条件时默认推送全量用户
    - _需求: 10.1, 10.3, 11.1, 12.1_
  - [x] 8.2 实现 AttributeFilterRow 组件
    - 每行包含：字段下拉框（目标平台/安卓版本/国家等）、运算符下拉框（=/≠/>/< 等）、值输入框（根据字段类型动态变化）、逻辑控制按钮（且/或切换）、删除按钮
    - 检测逻辑冲突并展示提示
    - _需求: 10.2, 10.4_
  - [x] 8.3 实现预估人数功能
    - 点击「预估人数」按钮调用 POST /push-tasks/estimate API
    - 展示「计算中...」加载状态，完成后显示预估数量
    - 网络异常时恢复按钮状态并提示「网络异常，请重试」
    - _需求: 12.1, 12.2, 12.3_
  - [ ]* 8.4 编写目标用户表单单元测试
    - 测试筛选条件添加/删除、逻辑冲突检测
    - _需求: 10.2, 10.4_

- [x] 9. 步骤3：推送配置表单与实时预览
  - [x] 9.1 实现 PushConfigForm 组件
    - 新建 `frontend/src/pages/Task/Create/components/PushConfigForm.jsx`
    - 包含：AB实验选择（非AB默认选中，AB规划中禁用）、内容模板下拉框、通知标题输入（必填，+插入参数）、通知内容输入（必填，+插入参数）、通知图片配置（可选，URL输入+上传）
    - 插入参数按钮弹出参数选择面板，选择后插入光标位置
    - 图片校验：jpg/png 格式，≤2MB
    - _需求: 13.1, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_
  - [x] 9.2 实现点击跳转配置
    - Radio 组：打开应用（默认）/ 打开特定链接
    - 选择「打开特定链接」时展示链接输入框，必填校验
    - _需求: 15.1, 15.2, 15.3_
  - [x] 9.3 实现通知样式配置
    - 基础样式 Radio（普通弹窗/类悬浮弹窗）、展开式通知 Radio（禁用/文本/大图等）、提示音 Select、是否震动 Radio
    - _需求: 16.1, 16.2_
  - [x] 9.4 实现 PreviewCard 实时预览组件
    - 新建 `frontend/src/pages/Task/Create/components/PreviewCard.jsx`
    - 固定宽度 320px，模拟手机通知样式
    - 实时同步标题、内容、图片和样式配置的变化
    - _需求: 17.1, 17.2, 17.3_
  - [ ]* 9.5 编写推送配置表单单元测试
    - 测试必填校验、图片格式校验、预览同步
    - _需求: 14.6, 14.7, 14.8, 15.3_

- [x] 10. 表单交互、校验与步骤4占位
  - [x] 10.1 实现全局表单交互样式
    - 输入框获得焦点时蓝色高亮边框
    - 失去焦点时执行实时校验，失败时红色边框+底部红色错误提示
    - 所有必填项标记红色「*」号
    - 可通过 Ant Design Form 的 rules 和 validateTrigger='onBlur' 实现
    - _需求: 19.1, 19.2, 19.3_
  - [x] 10.2 实现步骤4目标设置占位
    - 在 StepContent 中步骤4区域展示提示文案「该功能规划中，后续版本开放」
    - _需求: 18.1, 18.2_

- [ ] 11. 集成联调与最终检查点
  - [ ] 11.1 串联所有组件与 API
    - 确保 CreatePushTask 页面正确集成所有子组件
    - 确保保存按钮调用后端 API 并正确处理响应
    - 确保从任务列表页点击「+创建任务」可正确跳转到创建页面
    - 确保保存的草稿任务在任务列表页「草稿」标签下可见
    - _需求: 1.1, 1.2, 1.3, 20.1, 20.2, 20.3_
  - [ ]* 11.2 编写端到端集成测试
    - 测试完整的创建任务流程：填写表单 → 保存草稿 → 返回列表
    - _需求: 20.1, 20.2, 20.3_

- [ ] 12. 最终检查点
  - 确保所有代码编译通过、页面可正常渲染，请用户确认是否有问题。

## 备注

- 标记 `*` 的子任务为可选测试任务，可跳过以加速 MVP 交付
- 每个任务引用了对应的需求编号，确保需求可追溯
- 检查点任务用于增量验证，确保每个阶段的代码质量
- 步骤4「目标设置」仅实现占位 UI，不含实际功能逻辑
