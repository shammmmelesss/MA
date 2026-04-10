# 修复编辑项目时未带入上次保存信息问题

## 问题分析

### 现象
编辑项目时，模态框中只显示了项目名称，其他字段（描述、项目负责人、关联App包等）都显示为空或未选中状态。

### 根本原因
在 [List.jsx](file:///Users/mac/project_dev/push_new/frontend/src/pages/Project/List.jsx#L80-L93) 的 `showModal` 函数中，编辑项目时直接使用 `form.setFieldsValue(project)` 来设置表单值，但后端返回的项目数据字段名与前端表单字段名不完全匹配。

**后端返回的字段名：**
- `project_id` - 项目ID
- `project_name` - 项目名称 ✓
- `description` - 描述 ✓
- `status` - 状态 ✓
- `project_manager` - 项目负责人 ✓
- `app_packages` - 关联App包 ✓
- `access_key` - AccessKey ✓

**问题：** 从截图和代码分析来看，后端返回的数据结构与前端表单字段名基本一致，但问题在于 `showModal` 函数在设置表单值时，没有等待模态框完全打开，且可能存在字段映射问题。

进一步分析发现：
1. 在 `showModal` 函数中，当 `project` 存在时，直接调用 `form.setFieldsValue(project)`
2. 但 `project` 对象中的 `app_packages` 是数组类型，而 Select 组件的 `mode="multiple"` 需要正确的值格式
3. 同样，`project_manager` 字段在后端可能是字符串，但前端 Select 需要匹配 options 中的 value

### 验证问题
查看后端返回的数据结构：
```go
type ProjectSpace struct {
    ProjectID      int64       `json:"project_id"`
    ProjectName    string      `json:"project_name"`
    Description    string      `json:"description"`
    Status         int         `json:"status"`
    ProjectManager string      `json:"project_manager"`
    AppPackages    StringArray `json:"app_packages"`
    AccessKey      string      `json:"access_key"`
    ...
}
```

前端表单字段：
- `project_name` - 项目名称
- `description` - 描述
- `status` - 状态
- `project_manager` - 项目负责人
- `app_packages` - 关联app包
- `access_key` - AccessKey

字段名匹配，问题在于 `showModal` 中的逻辑：

```javascript
const showModal = (project = null) => {
    setEditingProject(project)
    if (project) {
      form.setFieldsValue(project)  // <-- 这里可能需要在 Modal 打开后再设置
    } else {
      form.resetFields()
      form.setFieldsValue({
        access_key: generateAccessKey(),
        status: 1
      })
    }
    setVisible(true)  // <-- Modal 在这里才打开
}
```

问题在于 `form.setFieldsValue(project)` 在 `setVisible(true)` 之前调用，但此时表单可能还未渲染完成。

## 修复方案

### 方案：使用 useEffect 在 Modal 打开后设置表单值

当 `visible` 变为 `true` 且 `editingProject` 存在时，使用 `useEffect` 来设置表单值。

### 代码修改

文件：[frontend/src/pages/Project/List.jsx](file:///Users/mac/project_dev/push_new/frontend/src/pages/Project/List.jsx)

**修改点 1：简化 showModal 函数**
```javascript
// 打开创建/编辑模态框
const showModal = (project = null) => {
  setEditingProject(project)
  setVisible(true)
}
```

**修改点 2：添加 useEffect 在 Modal 打开后设置表单值**
```javascript
// 当 Modal 打开且有编辑项目时，设置表单值
useEffect(() => {
  if (visible && editingProject) {
    form.setFieldsValue({
      project_name: editingProject.project_name,
      description: editingProject.description,
      status: editingProject.status,
      project_manager: editingProject.project_manager,
      app_packages: editingProject.app_packages || [],
      access_key: editingProject.access_key,
    })
  } else if (visible && !editingProject) {
    // 创建新项目
    form.resetFields()
    form.setFieldsValue({
      access_key: generateAccessKey(),
      status: 1
    })
  }
}, [visible, editingProject, form])
```

**修改点 3：关闭 Modal 时重置表单**
```javascript
// 关闭模态框
const handleCancel = () => {
  setVisible(false)
  setEditingProject(null)
  form.resetFields()  // 添加这行
}
```

## 实施步骤

1. 修改 `showModal` 函数，移除其中的表单设置逻辑
2. 添加 `useEffect` 监听 `visible` 和 `editingProject` 变化
3. 在 `handleCancel` 中添加 `form.resetFields()`

## 验证计划

1. 打开项目列表页面
2. 点击任意项目的"编辑"按钮
3. 验证所有字段是否正确显示上次保存的值：
   - 项目名称
   - 描述
   - 状态
   - 项目负责人
   - 关联App包
   - AccessKey
4. 点击"取消"关闭模态框
5. 点击"创建项目"按钮，验证表单为空（除了自动生成的 AccessKey 和默认状态）
