import { CheckCircleFilled } from '@ant-design/icons'
import { useTaskFormContext } from '../hooks/useTaskForm'

const steps = [
  { key: 0, label: '推送时机' },
  { key: 1, label: '用户属性' },
  { key: 2, label: '推送配置' },
  { key: 3, label: '目标设置（规划中）', disabled: true },
]

function StepNavigator() {
  const { state, setCurrentStep, markStepCompleted } = useTaskFormContext()
  const { currentStep, completedSteps } = state

  const handleClick = (step) => {
    if (step.disabled) return
    if (step.key === currentStep) return
    if (step.key > currentStep && !completedSteps.has(step.key)) return // 未开始步骤不响应点击

    // 步骤切换时自动保存当前步骤数据（标记当前步骤为已完成）
    if (currentStep > step.key) {
      // 点击已访问过的步骤，直接跳转
      setCurrentStep(step.key)
    } else {
      // 点击下一步，需要先验证当前步骤
      markStepCompleted(currentStep)
      setCurrentStep(step.key)
    }
  }

  const handleKeyDown = (e, step) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(step)
    }
  }

  return (
    <nav style={{ width: 160, padding: '16px 0' }} aria-label="任务步骤导航">
      {steps.map((step, index) => {
        const isCurrent = step.key === currentStep
        const isCompleted = completedSteps.has(step.key)
        const isDisabled = step.disabled
        const isClickable = !isDisabled && (isCompleted || step.key < currentStep)

        let color = '#999'
        let fontWeight = 'normal'

        if (isCurrent) {
          color = '#1677ff'
          fontWeight = 600
        } else if (isCompleted) {
          color = '#1677ff'
        }
        if (isDisabled) {
          color = '#ccc'
        }

        return (
          <div key={step.key} style={{ position: 'relative' }}>
            <div
              onClick={() => handleClick(step)}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-current={isCurrent ? 'step' : undefined}
              aria-disabled={isDisabled}
              onKeyDown={(e) => handleKeyDown(e, step)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                cursor: isClickable ? 'pointer' : 'default',
                color,
                fontWeight,
                borderLeft: isCurrent ? '3px solid #1677ff' : '3px solid transparent',
                background: isCurrent ? '#e6f4ff' : 'transparent',
                transition: 'all 0.2s',
                userSelect: 'none',
                zIndex: 1,
              }}
            >
              <span style={{ marginRight: 8, width: 20, textAlign: 'center', flexShrink: 0 }}>
                {isCompleted && !isCurrent ? (
                  <CheckCircleFilled style={{ color: '#1677ff', fontSize: 18 }} />
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `1px solid ${isCurrent ? '#1677ff' : '#d9d9d9'}`,
                    fontSize: 12,
                    background: isCurrent ? '#1677ff' : 'transparent',
                    color: isCurrent ? '#fff' : color,
                  }}>
                    {isCompleted ? (
                      <CheckCircleFilled style={{ fontSize: 12 }} />
                    ) : (
                      step.key + 1
                    )}
                  </span>
                )}
              </span>
              {step.label}
            </div>
            {/* 连接线 */}
            {index < steps.length - 1 && !step.disabled && (
              <div
                style={{
                  position: 'absolute',
                  left: 9,
                  top: '100%',
                  width: 2,
                  height: 24,
                  background: isCompleted ? '#1677ff' : '#d9d9d9',
                  zIndex: 0,
                }}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default StepNavigator
