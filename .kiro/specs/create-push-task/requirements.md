# Requirements Document

## Introduction

本文档定义「新建推送任务」功能的需求规格。用户从任务列表页点击「+创建任务」按钮后，进入一个全屏表单页面（非弹窗），通过4个步骤（推送时机、目标用户、推送配置、目标设置）完成推送任务的创建。页面采用左侧步骤导航 + 右侧表单内容区的布局，支持草稿保存、实时预览和分步校验。

## Glossary

- **Task_Creation_Page**: 新建推送任务的全屏表单页面，包含顶部操作栏、左侧步骤导航和右侧内容区
- **Step_Navigator**: 左侧垂直步骤导航组件，展示4个步骤的状态（当前/已完成/未开始/规划中）
- **Top_Bar**: 页面顶部操作栏，包含返回按钮、任务名称输入框、系统管理链接、取消按钮和保存按钮
- **Push_Timing_Form**: 步骤1「推送时机」表单，用于配置推送类型和时间规则
- **Target_User_Form**: 步骤2「目标用户」表单，用于配置用户属性筛选条件
- **Push_Config_Form**: 步骤3「推送配置」表单，用于配置推送内容、样式和交互
- **Preview_Card**: 右侧实时预览卡片，模拟手机通知样式展示标题和内容
- **Push_Type**: 推送类型，包含5种：定时-单次、定时-重复、触发-完成A、触发-完成A后未完成B、topic
- **Attribute_Filter**: 用户属性筛选条件行，包含字段下拉、运算符下拉、值输入和逻辑控制
- **Event_Combination_Form**: 触发类型推送的事件组合逻辑表单，支持添加多个事件和筛选条件
- **Task_List_Page**: 现有的任务列表页面（frontend/src/pages/Task/List.jsx）

## Requirements

### Requirement 1: 页面路由与入口

**User Story:** As a 运营人员, I want to 从任务列表页点击「+创建任务」按钮进入新建推送任务页面, so that 我可以开始创建推送任务。

#### Acceptance Criteria

1. WHEN 运营人员点击 Task_List_Page 上的「+创建任务」按钮, THE Task_Creation_Page SHALL 以全屏页面形式打开（独立路由，非弹窗），隐藏系统侧边栏和顶部导航。
2. THE Task_Creation_Page SHALL 使用独立路由路径 `/tasks/create`，不嵌套在主布局的侧边栏和顶部导航内。
3. WHEN Task_Creation_Page 加载完成, THE Step_Navigator SHALL 默认选中步骤1「推送时机」，步骤2和步骤3显示为未开始状态（灰色），步骤4显示为规划中状态（灰色且不可点击）。

### Requirement 2: 顶部操作栏

**User Story:** As a 运营人员, I want to 在顶部操作栏中输入任务名称并执行取消或保存操作, so that 我可以管理当前编辑的推送任务。

#### Acceptance Criteria

1. THE Top_Bar SHALL 展示以下元素：左侧返回按钮（箭头图标）、任务名称输入框（placeholder「请输入任务名称」）、右侧系统管理链接、取消按钮和保存按钮。
2. WHEN 运营人员点击 Top_Bar 的返回按钮, THE Task_Creation_Page SHALL 弹出确认框「是否放弃当前编辑？」，确认后返回 Task_List_Page。
3. WHEN 运营人员点击 Top_Bar 的「取消」按钮, THE Task_Creation_Page SHALL 弹出确认框「是否放弃当前编辑？」，确认后返回 Task_List_Page，取消则留在当前页面。
4. WHEN 运营人员点击 Top_Bar 的「保存」按钮, THE Task_Creation_Page SHALL 校验当前步骤的必填项，校验通过后将任务保存为草稿状态。
5. IF 保存时当前步骤存在未填写的必填项, THEN THE Task_Creation_Page SHALL 阻止保存操作，滚动到第一个错误字段并展示红色错误提示。
6. WHEN 草稿保存成功, THE Task_Creation_Page SHALL 在顶部展示「草稿保存成功」提示信息。

### Requirement 3: 步骤导航

**User Story:** As a 运营人员, I want to 通过左侧步骤导航在各步骤间切换, so that 我可以分步完成推送任务的配置。

#### Acceptance Criteria

1. THE Step_Navigator SHALL 垂直展示4个步骤：「推送时机」「目标用户」「推送配置」「目标设置（规划中）」。
2. THE Step_Navigator SHALL 将当前步骤显示为蓝色高亮状态，已完成步骤显示蓝色对勾标记，未开始步骤显示灰色，步骤4「目标设置」显示灰色且不可点击。
3. WHEN 运营人员点击已完成状态的步骤, THE Step_Navigator SHALL 切换到该步骤并展示对应的表单内容。
4. WHEN 运营人员点击未开始状态的步骤, THE Step_Navigator SHALL 不执行任何切换操作。
5. WHEN 步骤切换发生, THE Task_Creation_Page SHALL 自动保存当前步骤已填写的表单数据，确保数据不丢失。

### Requirement 4: 推送时机 - 推送类型选择

**User Story:** As a 运营人员, I want to 选择推送类型, so that 我可以配置不同的推送触发方式。

#### Acceptance Criteria

1. THE Push_Timing_Form SHALL 展示5个推送类型单选按钮：「定时-单次」「定时-重复」「触发-完成A」「触发-完成A后未完成B」「topic」。
2. WHEN 运营人员切换推送类型, THE Push_Timing_Form SHALL 隐藏当前类型的控件组并显示新类型对应的控件组。
3. WHEN 运营人员切换推送类型, THE Push_Timing_Form SHALL 清空与当前类型无关的表单数据。

### Requirement 5: 推送时机 - 定时-单次

**User Story:** As a 运营人员, I want to 配置单次定时推送的时间, so that 推送在指定时间点发送一次。

#### Acceptance Criteria

1. WHEN 运营人员选择「定时-单次」推送类型, THE Push_Timing_Form SHALL 展示日期选择器、时间输入框（格式 hh:mm，24小时制）和时区标签（固定显示「用户时区」）。
2. THE Push_Timing_Form SHALL 将日期选择器、时间输入框标记为必填项（红色 * 标记）。
3. IF 运营人员设置的推送时间早于当前时间, THEN THE Push_Timing_Form SHALL 展示错误提示「推送时间不能早于当前时间」并阻止保存。
4. WHEN 运营人员 hover 时区标签「用户时区」, THE Push_Timing_Form SHALL 展示 tooltip 提示「推送将按用户设备所在时区执行」。

### Requirement 6: 推送时机 - 定时-重复

**User Story:** As a 运营人员, I want to 配置周期性重复推送, so that 推送按照设定的周期自动重复发送。

#### Acceptance Criteria

1. WHEN 运营人员选择「定时-重复」推送类型, THE Push_Timing_Form SHALL 展示重复周期下拉框（选项：每天/每周/每月）、动态重复日期选择器、时间输入框（格式 hh:mm）、时区标签和可选的结束日期选择器。
2. WHEN 运营人员选择重复周期「每天」, THE Push_Timing_Form SHALL 仅展示时间输入框，隐藏重复日期选择器。
3. WHEN 运营人员选择重复周期「每周」, THE Push_Timing_Form SHALL 展示周一至周日的复选框组，运营人员至少选择1天。
4. WHEN 运营人员选择重复周期「每月」, THE Push_Timing_Form SHALL 展示1~31号的多选器，支持选择多个日期。
5. IF 运营人员选择每月31号推送, THEN THE Push_Timing_Form SHALL 展示 tooltip 提示「当月无对应日期时将跳过推送」。
6. IF 时间输入框内容不符合 hh:mm 格式（00:00~23:59）, THEN THE Push_Timing_Form SHALL 将输入框边框变红并展示提示「请输入合法时间（hh:mm）」。
7. IF 结束日期早于当前时间, THEN THE Push_Timing_Form SHALL 展示错误提示「结束日期不能早于当前时间」并阻止保存。
8. IF 未选择重复周期, THEN THE Push_Timing_Form SHALL 展示提示「请选择重复周期」并阻止保存。
9. IF 选择「每周」或「每月」但未选择任何重复日期, THEN THE Push_Timing_Form SHALL 展示提示「请至少选择一个重复日期」并阻止保存。
10. WHEN 配置完成, THE Push_Timing_Form SHALL 在表单下方展示预览文案（如「每周一、三、五 21:00（用户时区）推送」）。

### Requirement 7: 推送时机 - 触发-完成A

**User Story:** As a 运营人员, I want to 配置基于用户事件触发的推送, so that 用户完成指定事件后自动收到推送。

#### Acceptance Criteria

1. WHEN 运营人员选择「触发-完成A」推送类型, THE Push_Timing_Form SHALL 展示生效时间范围选择器、事件组合逻辑表单、触达时机下拉框和频率控制开关。
2. THE Event_Combination_Form SHALL 支持通过「+添加事件」按钮新增事件行，多个事件之间默认为「且」逻辑关系。
3. THE Event_Combination_Form SHALL 支持每个事件行通过「+筛选」按钮添加属性筛选条件（字段+运算符+值）。
4. THE Event_Combination_Form SHALL 支持在事件组下方通过「且满足」添加全局属性筛选条件。
5. WHEN 仅剩1个事件行时, THE Event_Combination_Form SHALL 禁用该事件行的「删除」按钮。
6. WHEN 运营人员选择触达时机为「延迟」, THE Push_Timing_Form SHALL 展示时间输入框，仅接受正整数和时间单位（分钟/小时/天）。
7. WHEN 运营人员开启频率控制开关, THE Push_Timing_Form SHALL 展开频次限制（每日/每周/每月最多推送N次）和间隔限制（同一用户触发间隔≥N分钟）配置子表单。
8. IF 未添加任何完成事件, THEN THE Push_Timing_Form SHALL 展示提示「请至少添加一个完成事件」并阻止保存。
9. IF 生效时间范围的开始日期晚于结束日期, THEN THE Push_Timing_Form SHALL 展示提示「开始日期不能晚于结束日期」并阻止保存。
10. IF 频率控制的推送次数或间隔值为0, THEN THE Push_Timing_Form SHALL 展示提示「推送次数/间隔不能为0」并阻止保存。

### Requirement 8: 推送时机 - 触发-完成A后未完成B

**User Story:** As a 运营人员, I want to 配置「完成A后未完成B」的触发推送, so that 用户完成事件A后在指定时间内未完成事件B时收到推送。

#### Acceptance Criteria

1. WHEN 运营人员选择「触发-完成A后未完成B」推送类型, THE Push_Timing_Form SHALL 展示与「触发-完成A」相同的控件组，并额外展示B事件选择和时间窗口配置（如「完成A后N小时内未完成B则触发」）。
2. THE Push_Timing_Form SHALL 将B事件选择和时间窗口标记为必填项。
3. IF B事件未选择或时间窗口未配置, THEN THE Push_Timing_Form SHALL 展示对应的错误提示并阻止保存。

### Requirement 9: 推送时机 - topic

**User Story:** As a 运营人员, I want to 选择 topic 进行推送, so that 推送面向所有订阅该 topic 的用户。

#### Acceptance Criteria

1. WHEN 运营人员选择「topic」推送类型, THE Push_Timing_Form SHALL 仅展示 topic 选择下拉框，隐藏所有时间和触发配置控件。
2. THE Push_Timing_Form SHALL 将 topic 选择标记为必填项。
3. IF topic 未选择, THEN THE Push_Timing_Form SHALL 展示提示「请选择 topic」并阻止保存。

### Requirement 10: 目标用户 - 属性筛选

**User Story:** As a 运营人员, I want to 通过用户属性筛选目标用户, so that 推送只发送给符合条件的用户群体。

#### Acceptance Criteria

1. THE Target_User_Form SHALL 展示「+添加属性」按钮，点击后新增一行 Attribute_Filter。
2. THE Attribute_Filter SHALL 包含：字段下拉框（目标平台/安卓版本/国家等）、运算符下拉框（= / ≠ / > / < 等）、值输入框（根据字段类型动态变化为文本输入或下拉选择）、逻辑控制按钮（「且」/「或」切换）和「删除」按钮。
3. WHEN 未添加任何筛选条件, THE Target_User_Form SHALL 默认推送全量用户，无需额外校验。
4. IF 多条件存在逻辑冲突（如「目标平台=iOS」且「目标平台=Android」）, THEN THE Target_User_Form SHALL 展示提示「筛选条件逻辑冲突，请修改」。

### Requirement 11: 目标用户 - 用户行为（规划中）

**User Story:** As a 运营人员, I want to 看到用户行为筛选的占位入口, so that 我知道该功能将在后续版本开放。

#### Acceptance Criteria

1. THE Target_User_Form SHALL 展示「+添加行为」按钮，该按钮处于禁用状态（灰色，不可点击）。

### Requirement 12: 目标用户 - 预估人数

**User Story:** As a 运营人员, I want to 预估符合筛选条件的用户数量, so that 我可以评估推送的覆盖范围。

#### Acceptance Criteria

1. THE Target_User_Form SHALL 展示蓝色「预估人数」按钮。
2. WHEN 运营人员点击「预估人数」按钮, THE Target_User_Form SHALL 展示「计算中...」加载状态，计算完成后显示预估用户数量。
3. IF 预估人数请求因网络异常失败, THEN THE Target_User_Form SHALL 将按钮恢复为「预估人数」状态并展示提示「网络异常，请重试」。

### Requirement 13: 推送配置 - AB实验

**User Story:** As a 运营人员, I want to 看到AB实验选项, so that 我知道当前默认为非AB实验模式。

#### Acceptance Criteria

1. THE Push_Config_Form SHALL 展示实验类型单选：「非AB实验」（默认选中，可用）和「AB实验（规划）」（禁用状态，不可选择）。

### Requirement 14: 推送配置 - 通知内容

**User Story:** As a 运营人员, I want to 配置推送的标题、内容和图片, so that 用户收到的推送通知包含正确的信息。

#### Acceptance Criteria

1. THE Push_Config_Form SHALL 展示内容模板下拉框（选项包含「随机列表」等模板）。
2. THE Push_Config_Form SHALL 展示必填的「通知标题」文本输入框，附带「+插入参数」按钮。
3. THE Push_Config_Form SHALL 展示必填的「通知内容」文本输入框，附带「+插入参数」按钮。
4. WHEN 运营人员点击「+插入参数」按钮, THE Push_Config_Form SHALL 弹出参数选择面板，选择后将参数自动插入到输入框光标位置。
5. THE Push_Config_Form SHALL 展示可选的「通知图片」配置，包含下拉框（默认「自定义」）、URL输入框和「点击上传」链接。
6. IF 通知标题为空, THEN THE Push_Config_Form SHALL 展示提示「请输入通知标题」并阻止保存。
7. IF 通知内容为空, THEN THE Push_Config_Form SHALL 展示提示「请输入通知内容」并阻止保存。
8. IF 上传的图片格式不是 jpg/png 或大小超过 2MB, THEN THE Push_Config_Form SHALL 展示提示「图片格式/大小不符合要求」并保留原输入。

### Requirement 15: 推送配置 - 点击跳转

**User Story:** As a 运营人员, I want to 配置用户点击推送通知后的跳转行为, so that 用户点击后能到达正确的目标页面。

#### Acceptance Criteria

1. THE Push_Config_Form SHALL 展示点击跳转单选按钮组：「打开应用」（默认选中）和「打开特定链接」。
2. WHEN 运营人员选择「打开特定链接」, THE Push_Config_Form SHALL 展示跳转链接输入框。
3. IF 选择「打开特定链接」但跳转链接为空, THEN THE Push_Config_Form SHALL 展示提示「请输入跳转链接」并阻止保存。

### Requirement 16: 推送配置 - 通知样式

**User Story:** As a 运营人员, I want to 配置推送通知的展示样式, so that 推送通知以合适的视觉形式呈现给用户。

#### Acceptance Criteria

1. THE Push_Config_Form SHALL 展示以下样式配置项：基础样式单选（普通弹窗/类悬浮弹窗，默认「普通弹窗」）、展开式通知单选（禁用/文本/大图/背景图/背景色值/右侧大图，默认「禁用」）、提示音下拉框（默认「已停用」）、是否震动单选（否/是，默认「否」）。
2. WHEN 运营人员切换通知样式配置, THE Preview_Card SHALL 同步更新展示样式。

### Requirement 17: 推送配置 - 实时预览

**User Story:** As a 运营人员, I want to 在右侧实时预览推送通知的效果, so that 我可以在保存前确认推送内容和样式。

#### Acceptance Criteria

1. THE Preview_Card SHALL 以固定宽度（320px）展示在推送配置表单的右侧，模拟手机通知样式。
2. WHEN 运营人员在通知标题或通知内容输入框中输入内容, THE Preview_Card SHALL 实时同步更新展示的标题和内容。
3. WHEN 运营人员切换通知样式配置, THE Preview_Card SHALL 同步更新展示样式。

### Requirement 18: 目标设置（规划中）

**User Story:** As a 运营人员, I want to 看到目标设置步骤的占位展示, so that 我知道该功能将在后续版本开放。

#### Acceptance Criteria

1. THE Step_Navigator SHALL 将步骤4「目标设置」显示为灰色不可点击状态。
2. THE Task_Creation_Page SHALL 在步骤4区域展示提示文案「该功能规划中，后续版本开放」。

### Requirement 19: 表单交互与校验

**User Story:** As a 运营人员, I want to 在填写表单时获得即时的输入反馈和校验提示, so that 我可以快速发现并修正错误。

#### Acceptance Criteria

1. WHEN 输入框或选择框获得焦点, THE Task_Creation_Page SHALL 将该控件边框高亮为蓝色。
2. WHEN 输入框失去焦点, THE Task_Creation_Page SHALL 对该字段执行实时校验，校验失败时将边框变为红色并在底部展示红色错误提示文案。
3. THE Task_Creation_Page SHALL 对所有必填项标记红色「*」号。

### Requirement 20: 草稿保存与数据持久化

**User Story:** As a 运营人员, I want to 将未完成的推送任务保存为草稿, so that 我可以稍后继续编辑。

#### Acceptance Criteria

1. WHEN 运营人员点击「保存」按钮且校验通过, THE Task_Creation_Page SHALL 通过 API 将当前所有步骤的表单数据保存为草稿状态的推送任务。
2. WHEN 草稿保存成功, THE Task_Creation_Page SHALL 保持在当前页面，运营人员可继续编辑。
3. THE Task_Creation_Page SHALL 将保存的草稿任务在 Task_List_Page 的「草稿」状态标签下展示。
