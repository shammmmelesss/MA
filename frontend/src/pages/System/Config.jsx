import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  message,
  Spin,
  Select,
  Popconfirm
} from 'antd';
import { EditOutlined, ReloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useCurrentProject, useProjects } from '../../App.jsx';

const { Option } = Select;

const SystemConfig = () => {
  const [loading, setLoading] = useState(true);
  const { currentProject } = useCurrentProject();
  const { refreshProjects } = useProjects();
  const [projectInfo, setProjectInfo] = useState({
    name: '',
    description: '',
    leader: '',
    createTime: '',
    lastUpdate: '',
    status: '',
    apps: []
  });

  const [editingLeader, setEditingLeader] = useState(false);
  const [currentLeader, setCurrentLeader] = useState([]);
  const [apps, setApps] = useState([]);
  
  // 模拟用户列表
  const userList = [
    { value: 'user1', label: '张三' },
    { value: 'user2', label: '李四' },
    { value: 'user3', label: '王五' },
    { value: 'user4', label: '赵六' }
  ];

  // 获取App列表
  const fetchApps = async () => {
    if (!currentProject) return;
    try {
      const response = await axios.get('/api/v1/apps', {
        params: { project_id: currentProject.project_id }
      });
      setApps(response.data.apps);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    }
  };

  // 获取当前项目详情
  const fetchProjectInfo = async () => {
    if (!currentProject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 并行请求项目信息和App列表
      const [projectResponse, appsResponse] = await Promise.all([
        axios.get(`/api/v1/projects/${currentProject.project_id}`),
        axios.get('/api/v1/apps', { params: { project_id: currentProject.project_id } })
      ]);
      
      const project = projectResponse.data;
      const appList = appsResponse.data.apps;
      setApps(appList);

      // 状态映射
      const statusMap = {
        'draft': '草稿',
        'reviewing': '审核中',
        'online': '已上线',
        'rejected': '已拒绝',
        'disabled': '已禁用'
      };

      const formattedInfo = {
        name: project.project_name || '',
        description: project.description || '',
        leader: project.project_manager || '',
        createTime: project.create_time || '',
        lastUpdate: project.update_time || '',
        status: project.status === 1 ? '正常' : '禁用',
        apps: project.app_packages ? project.app_packages.map((pkg, index) => {
          // 查找对应的App信息
          const appInfo = appList.find(app => app.app_id === pkg);
          return {
            id: index + 1,
            app_id: pkg,
            name: appInfo?.game_name || pkg,
            platform: appInfo?.platform_type || (pkg.includes('Android') ? 'Android' : 'iOS'),
            status: statusMap[appInfo?.status] || '已接入'
          };
        }) : []
      };

      setProjectInfo(formattedInfo);
      const leaders = project.project_manager ? [project.project_manager] : [];
      setCurrentLeader(leaders);
      setEditingLeader(false);
    } catch (error) {
      message.error('获取项目信息失败');
      console.error('Failed to fetch project info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectInfo();
  }, [currentProject]);

  // 开始编辑负责人
  const startEditLeader = () => {
    setEditingLeader(true);
  };

  // 取消编辑负责人
  const cancelEditLeader = () => {
    setEditingLeader(false);
    // 将负责人转换为数组格式
    const leaders = projectInfo.leader ? [projectInfo.leader] : [];
    setCurrentLeader(leaders);
  };

  // 保存负责人变更
  const saveLeader = async () => {
    if (!currentLeader || currentLeader.length === 0) {
      message.error('请选择至少一个负责人');
      return;
    }
    
    setLoading(true);
    try {
      const projectResponse = await axios.get(`/api/v1/projects/${currentProject.project_id}`);
      const project = projectResponse.data;
      
      await axios.put(`/api/v1/projects/${currentProject.project_id}`, {
        project_id: currentProject.project_id,
        project_name: project.project_name,
        description: project.description,
        status: project.status,
        project_manager: currentLeader[0],
        access_key: project.access_key
      });
      
      // 更新本地状态
      setProjectInfo(prev => ({
        ...prev,
        leader: currentLeader[0]
      }));
      
      message.success('负责人更新成功');
      setEditingLeader(false);
      refreshProjects();
    } catch (error) {
      message.error('负责人更新失败');
      console.error('Failed to update project manager:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>项目信息</h1>
      </div>

      <Spin spinning={loading} tip="加载项目信息...">
        {currentProject ? (
          <>
            <Card title="基本信息" style={{ marginBottom: 24 }}>
              <Descriptions bordered column={{ xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}>
                <Descriptions.Item label="项目ID">{currentProject.project_id}</Descriptions.Item>
                <Descriptions.Item label="项目名称">{projectInfo.name}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{projectInfo.createTime}</Descriptions.Item>
                <Descriptions.Item label="最后更新">{projectInfo.lastUpdate}</Descriptions.Item>
                <Descriptions.Item label="项目状态" span={3}>
                  <Tag color={projectInfo.status === '正常' ? 'green' : 'blue'}>
                    {projectInfo.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="负责人" span={3}>
                  {editingLeader ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Select
                        mode="multiple"
                        value={currentLeader}
                        onChange={setCurrentLeader}
                        style={{ width: 300, marginRight: 12 }}
                        placeholder="选择负责人"
                        showSearch
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {userList.map(user => (
                          <Option key={user.value} value={user.label}>
                            {user.label}
                          </Option>
                        ))}
                      </Select>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={saveLeader}
                        style={{ marginRight: 8 }}
                      >
                        保存
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={cancelEditLeader}
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>{projectInfo.leader || '-'}</span>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={startEditLeader}
                        style={{ marginLeft: 8 }}
                      >
                        编辑
                      </Button>
                    </div>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="项目描述" span={3}>
                  <p style={{ margin: 0, lineHeight: '1.5' }}>{projectInfo.description || '-'}</p>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="关联应用" style={{ marginBottom: 24 }}>
              <Table
                dataSource={projectInfo.apps}
                rowKey="app_id"
                pagination={false}
                locale={{ emptyText: '暂无关联应用' }}
                columns={[
                  { title: 'ID', dataIndex: 'app_id', key: 'app_id' },
                  { title: '名称', dataIndex: 'name', key: 'name' },
                  { title: '平台', dataIndex: 'platform', key: 'platform' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => (
                      <Tag color={
                        status === '已上线' ? 'green' :
                        status === '审核中' ? 'blue' :
                        status === '已拒绝' ? 'red' :
                        status === '已禁用' ? 'default' : 'green'
                      }>
                        {status}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>


          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p>暂无项目数据</p>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default SystemConfig;