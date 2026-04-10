import React, { useState } from 'react';
import { Card, Button, Input, Select, DatePicker, Table, Tag, Space, Modal, Divider } from 'antd';
import { PlusOutlined, TableOutlined, AppstoreOutlined, MessageOutlined, PushpinOutlined, ApiOutlined, WechatOutlined, BellOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const CampaignList = () => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleCreateCampaign = () => {
    console.log('点击了创建计划按钮，准备显示弹窗');
    setModalVisible(true);
  };
  
  const handleModalClose = () => {
    setModalVisible(false);
  };
  
  const handleCancel = () => {
    console.log('点击了放弃创建按钮');
    setModalVisible(false);
  };
  
  const handleCreate = () => {
    console.log('点击了创建计划按钮');
    // 这里可以添加创建计划的逻辑
    setModalVisible(false);
  };
  
  // 模拟数据
  const dataSource = [
    {
      id: '18838',
      name: '流量加油包',
      timeRange: '03-25 至 09-26',
      channels: ['短信', '极光短信'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '158****0009',
    },
    {
      id: '18834',
      name: '我的测试计划',
      timeRange: '03-25 00:00 至 03-27 00:00',
      channels: ['Webhook', '自定义通知通道'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '131****1599',
    },
    {
      id: '18828',
      name: '订单的副本2',
      timeRange: '03-18 00:31 至 3月15日00:00',
      channels: ['Webhook', 'EDM'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '185****0048',
    },
    {
      id: '18818',
      name: '流失用户唤醒',
      timeRange: '03-12 至 03-14',
      channels: ['短信', '极光短信'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '183****9479',
    },
    {
      id: '18816',
      name: 'ttt',
      timeRange: '11-11 至 12-05',
      channels: ['短信', '极光短信'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '153****7281',
    },
    {
      id: '18814',
      name: '订单的副本1',
      timeRange: '03-10 至 03-12',
      channels: ['Webhook', 'EDM'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '185****0048',
    },
    {
      id: '18813',
      name: '订单',
      timeRange: '',
      channels: ['Webhook', 'EDM'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '185****0048',
    },
    {
      id: '18812',
      name: 'webhook0309',
      timeRange: '',
      channels: ['Webhook'],
      status: '待审批',
      targetCompletion: '暂无数据，计划尚未审批',
      overallCompletion: '暂无数据',
      group: '默认分组',
      creator: '185****0048',
    },
  ];

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '计划名称起止时间',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>{record.timeRange}</div>
        </div>
      ),
    },
    {
      title: '触达通道',
      dataIndex: 'channels',
      key: 'channels',
      render: (channels) => (
        <Space direction="vertical" size="small">
          {channels.map((channel, index) => (
            <Tag key={index}>{channel}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '目标完成率/发送',
      dataIndex: 'targetCompletion',
      key: 'targetCompletion',
    },
    {
      title: '总体目标完成率',
      dataIndex: 'overallCompletion',
      key: 'overallCompletion',
    },
    {
      title: '分组',
      dataIndex: 'group',
      key: 'group',
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
    },
    {
      title: '操作',
      key: 'action',
      render: (record) => (
        <Space size="middle">
          <a>查看</a>
          <a>编辑</a>
          <a href={`/campaigns/approval/${record.id}`}>审批</a>
          <a>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>运菅计划列表</h2>
          <Space>
            <Button type="default">
              <PlusOutlined /> 已归档计划
            </Button>
            <Button type="primary" onClick={handleCreateCampaign}>
              <PlusOutlined /> 创建计划
            </Button>
            <Button type="default" icon={<TableOutlined />}>
              列表
            </Button>
            <Button type="default" icon={<AppstoreOutlined />}>
              看板
            </Button>
          </Space>
        </div>

        {/* 标签页 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Tag color="blue">全部 (192)</Tag>
            <Tag color="green">运行中 (10)</Tag>
            <Tag color="yellow">暂停中 (12)</Tag>
            <Tag color="orange">待审批 (123)</Tag>
            <Tag color="red">已结束 (46)</Tag>
            <Tag color="gray">草稿箱 (1)</Tag>
          </Space>
        </div>

        {/* 搜索栏 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input placeholder="搜索计划名称、计划ID" style={{ width: 200 }} />
          <RangePicker placeholder={['选择开始时间', '选择结束时间']} />
          <Select placeholder="请选择" style={{ width: 150 }}>
            <Option value="all">全部</Option>
            <Option value="sms">短信</Option>
            <Option value="email">邮件</Option>
            <Option value="webhook">Webhook</Option>
          </Select>
          <Select placeholder="全部" style={{ width: 150 }}>
            <Option value="all">全部</Option>
            <Option value="marketing">营销活动</Option>
            <Option value="operation">运营计划</Option>
          </Select>
          <Select placeholder="全部" style={{ width: 150 }}>
            <Option value="all">全部</Option>
            <Option value="default">默认分组</Option>
            <Option value="custom">自定义分组</Option>
          </Select>
          <Select placeholder="全部" style={{ width: 150 }}>
            <Option value="all">全部</Option>
            <Option value="user1">158****0009</Option>
            <Option value="user2">131****1599</Option>
          </Select>
        </div>

        {/* 表格 */}
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey="id"
          pagination={{
            total: 192,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
      
      {/* 创建计划弹窗 */}
      <Modal
        title="选择运营计划触达方式"
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <div style={{ padding: '20px 0' }}>
          {/* 基础触达方式 */}
          <Space wrap size={24} style={{ marginBottom: 24 }}>
            <Card
              style={{
                width: 240,
                height: 120,
                border: `2px solid #52c41a`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                <div
                  style={{
                    fontSize: 32,
                    color: '#52c41a',
                  }}
                >
                  <MessageOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>短信</div>
                </div>
              </div>
            </Card>
            <Card
              style={{
                width: 240,
                height: 120,
                border: `2px solid #d9d9d9`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                <div
                  style={{
                    fontSize: 32,
                    color: '#faad14',
                  }}
                >
                  <PushpinOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>App推送</div>
                </div>
              </div>
            </Card>
            <Card
              style={{
                width: 240,
                height: 120,
                border: `2px solid #d9d9d9`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                <div
                  style={{
                    fontSize: 32,
                    color: '#1890ff',
                  }}
                >
                  <ApiOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>Webhook</div>
                </div>
              </div>
            </Card>
          </Space>

          {/* 微信触达 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 16, backgroundColor: '#1890ff', borderRadius: 2 }}></div>
              <h3 style={{ margin: 0, fontSize: 16 }}>微信触达</h3>
            </div>
            
            <Space wrap size={24}>
              <Card
                style={{ width: 240, height: 120, border: '1px solid #d9d9d9', borderRadius: 8 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 24, color: '#1890ff' }}><WechatOutlined /></div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>服务号模板消息</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 'auto' }}>尚未授权或开启账号</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#1890ff', cursor: 'pointer' }}>
                    前往设置
                  </div>
                </div>
              </Card>
              <Card
                style={{ width: 240, height: 120, border: '1px solid #d9d9d9', borderRadius: 8 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 24, color: '#1890ff' }}><BellOutlined /></div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>活跃推送</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 'auto' }}>尚未授权或开启账号</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#1890ff', cursor: 'pointer' }}>
                    前往设置
                  </div>
                </div>
              </Card>
              <Card
                style={{ width: 240, height: 120, border: '1px solid #d9d9d9', borderRadius: 8 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 24, color: '#1890ff' }}><MessageOutlined /></div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>公众号群发</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 'auto' }}>尚未授权或开启账号</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#1890ff', cursor: 'pointer' }}>
                    前往设置
                  </div>
                </div>
              </Card>
            </Space>
          </div>

          {/* 弹窗触达 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 4, height: 16, backgroundColor: '#1890ff', borderRadius: 2 }}></div>
              <h3 style={{ margin: 0, fontSize: 16 }}>弹窗触达</h3>
            </div>
            
            <Space wrap size={24}>
              <Card
                style={{ width: 240, height: 120, border: '1px solid #d9d9d9', borderRadius: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                  <div style={{ fontSize: 32, color: '#1890ff' }}><BellOutlined /></div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>App内弹窗</div>
                </div>
              </Card>
              <Card
                style={{ width: 240, height: 120, border: '1px solid #d9d9d9', borderRadius: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                  <div style={{ fontSize: 32, color: '#1890ff' }}><WechatOutlined /></div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>微信小程序弹窗</div>
                </div>
              </Card>
            </Space>
          </div>
        </div>

        <Divider style={{ margin: '24px 0 0 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 0 0 0' }}>
          <Button onClick={handleCancel}>
            放弃创建
          </Button>
          <Button type="primary" onClick={handleCreate}>
            创建计划
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CampaignList;