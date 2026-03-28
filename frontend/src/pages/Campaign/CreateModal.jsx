import React from 'react';
import { Modal, Button } from 'antd';

const CreateCampaignModal = ({ visible, onClose }) => {
  const handleCancel = () => {
    onClose();
  };

  const handleCreate = () => {
    // 这里可以添加创建计划的逻辑
    onClose();
  };

  return (
    <Modal
      title="选择运营计划触达方式"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
    >
      <div style={{ padding: '20px 0' }}>
        <h3>触达方式选择</h3>
        <p>这是一个简化版本的触达方式选择弹窗</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 0 0 0' }}>
        <Button onClick={handleCancel}>
          放弃创建
        </Button>
        <Button type="primary" onClick={handleCreate}>
          创建计划
        </Button>
      </div>
    </Modal>
  );
};

export default CreateCampaignModal;