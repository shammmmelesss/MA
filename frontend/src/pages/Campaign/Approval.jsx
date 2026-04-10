import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Select, DatePicker, Table, Tag, Input, Form, Radio, Divider, Descriptions, message } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;
const { TextArea } = Input;

const CampaignApproval = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState({
    id: '',
    name: '',
    creator: '',
    createTime: '',
    timeRange: '',
    channels: [],
    group: '',
    description: '',
  });
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [triggerRules, setTriggerRules] = useState([]);
  const [targetUsers, setTargetUsers] = useState([]);
  
  // 模拟根据ID获取审批详情的API
  const fetchApprovalDetails = async (campaignId) => {
    setLoading(true);
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟根据ID返回不同数据
      const mockData = {
        '18838': {
          id: '18838',
          name: '流量加油包',
          creator: '158****0009',
          createTime: '2026-03-25 14:30:00',
          timeRange: '03-25 至 09-26',
          channels: ['短信', '极光短信'],
          group: '默认分组',
          description: '提升用户活跃度，增加平台流量',
        },
        '18834': {
          id: '18834',
          name: '我的测试计划',
          creator: '131****1599',
          createTime: '2026-03-25 10:00:00',
          timeRange: '03-25 00:00 至 03-27 00:00',
          channels: ['Webhook', '自定义通知通道'],
          group: '默认分组',
          description: '测试计划描述',
        },
        '18828': {
          id: '18828',
          name: '订单的副本2',
          creator: '185****0048',
          createTime: '2026-03-24 16:00:00',
          timeRange: '03-18 00:31 至 3月15日00:00',
          channels: ['Webhook', 'EDM'],
          group: '默认分组',
          description: '订单相关计划',
        }
      };
      
      // 设置数据
      setApprovalDetails(mockData[campaignId] || mockData['18838']);
      setApprovalHistory([
        {
          id: 1,
          approver: '138****0001',
          time: '2026-03-25 15:00:00',
          status: '待审批',
          comment: '等待审批中',
        },
      ]);
      setTriggerRules([
        {
          id: 1,
          ruleName: '首次登录触发',
          condition: '用户首次登录后',
          delay: '立即',
        },
        {
          id: 2,
          ruleName: '7天未登录触发',
          condition: '用户连续7天未登录',
          delay: '立即',
        },
      ]);
      setTargetUsers([
        {
          id: 1,
          segmentName: '活跃用户',
          userCount: '10,000',
        },
        {
          id: 2,
          segmentName: '高价值用户',
          userCount: '5,000',
        },
      ]);
      
    } catch (error) {
      message.error('获取审批详情失败');
      console.error('获取审批详情失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 当ID变化时加载数据
  useEffect(() => {
    if (id) {
      fetchApprovalDetails(id);
    }
  }, [id]);
  
  const handleCancel = () => {
    navigate('/campaigns/list');
  };
  
  const handleApprove = () => {
    // 这里可以添加审批通过的逻辑
    setApproved(true);
    form.setFieldsValue({ approvalResult: 'approved' });
  };
  
  const handleReject = () => {
    // 这里可以添加驳回的逻辑
    setRejected(true);
    form.setFieldsValue({ approvalResult: 'rejected' });
  };
  
  const handleSubmit = () => {
    form.validateFields().then(values => {
      console.log('审批结果:', values);
      // 这里可以添加提交审批结果的逻辑
      message.success('审批成功');
      navigate('/campaigns/list');
    });
  };
  
  return (
    <div>
      {/* 顶部导航 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleCancel} style={{ marginRight: 16 }}>
            返回
          </Button>
          <h1 style={{ margin: 0, fontSize: 18 }}>活动审批</h1>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div style={{ display: 'flex', gap: 24 }}>
        {/* 左侧：审批详情 */}
        <div style={{ flex: 1 }}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="计划ID">{approvalDetails.id}</Descriptions.Item>
              <Descriptions.Item label="计划名称">{approvalDetails.name}</Descriptions.Item>
              <Descriptions.Item label="创建人">{approvalDetails.creator}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{approvalDetails.createTime}</Descriptions.Item>
              <Descriptions.Item label="执行周期" span={2}>{approvalDetails.timeRange}</Descriptions.Item>
              <Descriptions.Item label="触达通道" span={2}>
                {approvalDetails.channels.map(channel => (
                  <Tag key={channel} style={{ marginRight: 8 }}>{channel}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="所属分组">{approvalDetails.group}</Descriptions.Item>
              <Descriptions.Item label="计划描述" span={2}>{approvalDetails.description}</Descriptions.Item>
            </Descriptions>
          </Card>
          
          {/* 触达规则 */}
          <Card title="触达规则" style={{ marginBottom: 24 }}>
            <Table
              dataSource={triggerRules}
              columns={[
                {
                  title: '规则名称',
                  dataIndex: 'ruleName',
                  key: 'ruleName',
                },
                {
                  title: '触发条件',
                  dataIndex: 'condition',
                  key: 'condition',
                },
                {
                  title: '延迟执行',
                  dataIndex: 'delay',
                  key: 'delay',
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
          
          {/* 目标用户 */}
          <Card title="目标用户" style={{ marginBottom: 24 }}>
            <Table
              dataSource={targetUsers}
              columns={[
                {
                  title: '分群名称',
                  dataIndex: 'segmentName',
                  key: 'segmentName',
                },
                {
                  title: '用户数量',
                  dataIndex: 'userCount',
                  key: 'userCount',
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
          
          {/* 审批记录 */}
          <Card title="审批记录">
            <Table
              dataSource={approvalHistory}
              columns={[
                {
                  title: '审批人',
                  dataIndex: 'approver',
                  key: 'approver',
                },
                {
                  title: '审批时间',
                  dataIndex: 'time',
                  key: 'time',
                },
                {
                  title: '审批状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => {
                    let color = 'blue';
                    if (status === '已通过') color = 'green';
                    if (status === '已驳回') color = 'red';
                    return <Tag color={color}>{status}</Tag>;
                  },
                },
                {
                  title: '审批意见',
                  dataIndex: 'comment',
                  key: 'comment',
                },
              ]}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
        
        {/* 右侧：审批操作 */}
        <div style={{ width: 400 }}>
          <Card title="审批操作" extra={<Tag color="orange">待审批</Tag>}>
            <Form form={form} layout="vertical">
              <Form.Item
                name="approvalResult"
                label="审批结果"
                rules={[{ required: true, message: '请选择审批结果' }]}
              >
                <Radio.Group onChange={(e) => {
                  setApproved(e.target.value === 'approved');
                  setRejected(e.target.value === 'rejected');
                }}>
                  <Radio value="approved">通过</Radio>
                  <Radio value="rejected">驳回</Radio>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="comment"
                label="审批意见"
                rules={[{ required: true, message: '请填写审批意见' }]}
              >
                <TextArea rows={6} placeholder="请输入审批意见" />
              </Form.Item>
              
              <Form.Item
                name="approvalTime"
                label="审批时间"
                initialValue={new Date().toLocaleString()}
              >
                <Input readOnly />
              </Form.Item>
              
              <div style={{ marginTop: 24 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" onClick={handleApprove} block>
                    <CheckOutlined /> 同意
                  </Button>
                  <Button type="default" onClick={handleReject} block>
                    <CloseOutlined /> 驳回
                  </Button>
                  <Button type="default" onClick={handleCancel} block>
                    取消
                  </Button>
                </Space>
              </div>
            </Form>
          </Card>
          
          <Card title="审批注意事项" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: '#666' }}>
              <p>1. 请仔细检查计划的时间范围、触达通道和目标用户</p>
              <p>2. 审批通过后，计划将自动进入运行状态</p>
              <p>3. 驳回后，创建人需要修改计划并重新提交审批</p>
              <p>4. 审批记录将永久保存，不可修改</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignApproval;