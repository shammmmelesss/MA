import React, { useState } from 'react';
import { Card, Button, Space, Select, Input, DatePicker, TimePicker, Checkbox, Steps, Radio } from 'antd';
import { ArrowLeftOutlined, WechatOutlined, MessageOutlined, BellOutlined, PushpinOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Step } = Steps;

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [planName, setPlanName] = useState('');
  const [group, setGroup] = useState('default');
  const [triggerType, setTriggerType] = useState('timed_single');
  const [sendDate, setSendDate] = useState(dayjs('2026-03-28'));
  const [sendTime, setSendTime] = useState(dayjs('09:00', 'HH:mm'));
  const [isAllUsers, setIsAllUsers] = useState(false);
  
  // 计划类型选项
  const planTypeOptions = [
    {
      value: 'timed_single',
      label: '定时型-单次',
      description: '单次执行的计划，固定时间发送'
    },
    {
      value: 'timed_repeat',
      label: '定时型-重复',
      description: '重复执行的计划，每个周期固定的一个或多个时间发送'
    },
    {
      value: 'trigger_a',
      label: '触发型-完成A',
      description: '当用户完成某个行为后发送'
    },
    {
      value: 'trigger_a_not_b',
      label: '触发型-完成A未完成B',
      description: '当用户完成某个行为后，一段时间内未完成另外一个行为后发送'
    }
  ];
  
  // 左侧菜单数据
  const leftMenuItems = [
    {
      id: 'trigger',
      title: '触发条件',
      icon: <BellOutlined />,
      active: true,
      time: '2026-03-28 09:00',
      description: '对受众用户进行触达'
    },
    {
      id: 'audience',
      title: '受众用户',
      icon: <WechatOutlined />,
      active: false,
      description: '用户行为'
    },
    {
      id: 'marketing',
      title: '营销动作',
      icon: <MessageOutlined />,
      active: false,
      description: '营销动作的渠道、用户、内容及发送设置'
    },
    {
      id: 'target',
      title: '目标设置',
      icon: <PushpinOutlined />,
      active: false,
      description: '设置运营计划的目标'
    }
  ];

  const handleCancel = () => {
    navigate('/campaigns/list');
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePublish = () => {
    // 这里可以添加发布计划的逻辑
    navigate('/campaigns/list');
  };

  const handleSaveDraft = () => {
    // 这里可以添加保存草稿的逻辑
    navigate('/campaigns/list');
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <div style={{ background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Input
            placeholder="请输入计划名称"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            style={{ width: 300, marginRight: 24 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 8 }}>分组</span>
          <Select
            value={group}
            onChange={setGroup}
            style={{ width: 120, marginRight: 24 }}
          >
            <Option value="default">默认分组</Option>
            <Option value="group1">分组1</Option>
            <Option value="group2">分组2</Option>
          </Select>
          <Button style={{ marginRight: 12 }} onClick={handleCancel}>
            放弃创建
          </Button>
          <Button style={{ marginRight: 12 }} onClick={handleSaveDraft}>
            保存草稿
          </Button>
          <Button type="primary" onClick={handlePublish}>
            发布
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{ display: 'flex', padding: '24px' }}>
        {/* 左侧菜单 */}
        <div style={{ width: 200, marginRight: 24 }}>
          <Steps current={currentStep} direction="vertical" progressDot>
            {leftMenuItems.map((item, index) => (
              <Step 
                key={index} 
                title={item.title} 
                description={item.description}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </Steps>
        </div>

        {/* 右侧内容 */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '8px', padding: '24px' }}>
          {/* 触发条件步骤 */}
          {currentStep === 0 && (
            <div>
              <h2 style={{ marginBottom: 24, fontSize: 18 }}>触发条件</h2>
              
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 500 }}>计划类型</h3>
                <Radio.Group 
                  value={triggerType} 
                  onChange={(e) => setTriggerType(e.target.value)}
                  style={{ display: 'flex', gap: 16 }}
                >
                  {planTypeOptions.map((option) => (
                    <Radio.Button 
                      key={option.value} 
                      value={option.value}
                      style={{ 
                        width: 200,
                        height: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '12px',
                        border: `2px solid ${triggerType === option.value ? '#1890ff' : '#d9d9d9'}`
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{option.label}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{option.description}</div>
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 500 }}>触发规则</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span>在</span>
                  <DatePicker 
                    value={sendDate} 
                    onChange={setSendDate} 
                    style={{ width: 150 }}
                  />
                  <span>日</span>
                  <TimePicker 
                    value={sendTime} 
                    onChange={setSendTime} 
                    format="HH:mm" 
                    style={{ width: 100 }}
                  />
                  <Checkbox 
                    checked={isAllUsers} 
                    onChange={(e) => setIsAllUsers(e.target.checked)}
                  >
                    对受众用户进行触达
                  </Checkbox>
                </div>
              </div>
            </div>
          )}

          {/* 受众用户步骤 */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ marginBottom: 24, fontSize: 18 }}>受众用户</h2>
              <div style={{ padding: '24px', background: '#fafafa', borderRadius: '8px' }}>
                <p>受众用户设置内容</p>
              </div>
            </div>
          )}

          {/* 营销动作步骤 */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ marginBottom: 24, fontSize: 18 }}>营销动作</h2>
              <div style={{ padding: '24px', background: '#fafafa', borderRadius: '8px' }}>
                <p>营销动作设置内容</p>
              </div>
            </div>
          )}

          {/* 目标设置步骤 */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ marginBottom: 24, fontSize: 18 }}>目标设置</h2>
              <div style={{ padding: '24px', background: '#fafafa', borderRadius: '8px' }}>
                <p>目标设置内容</p>
              </div>
            </div>
          )}

          {/* 底部操作按钮 */}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-start' }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrevious}>
                  上一步
                </Button>
              )}
              {currentStep < 3 && (
                <Button type="primary" onClick={handleNext}>
                  下一步
                </Button>
              )}
              {currentStep === 3 && (
                <Button type="primary" onClick={handlePublish}>
                  发布
                </Button>
              )}
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;