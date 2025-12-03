/**
 * Referral Page
 * Patient referral program interface - display code, share options, history
 * T6-024: Implement referral program for patient acquisition
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, message, Modal, Spin, Table, Tag, Tooltip } from 'antd';
import {
  CopyOutlined,
  MailOutlined,
  PhoneOutlined,
  ShareAltOutlined,
  FacebookOutlined,
  TwitterOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import { ReferralStats } from '../components/ReferralStats';
import './ReferralPage.css';

interface Referral {
  id: string;
  code: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  refereeName: string | null;
  refereeEmail: string | null;
  createdAt: Date;
  completedAt: Date | null;
  rewardsEarned: number;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewardsEarned: number;
  appliedRewardsValue: number;
  pendingRewardsValue: number;
}

export const ReferralPage: React.FC = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Load or create referral code
      const codeResponse = await fetch('/api/referrals/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        setReferralCode(codeData.data.code);
      } else if (codeResponse.status === 404) {
        // Create new referral code
        const createResponse = await fetch('/api/referrals', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const createData = await createResponse.json();
        setReferralCode(createData.data.referralCode);
      }

      // Load referral stats
      const statsResponse = await fetch('/api/users/me/referral-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Load referral history
      const historyResponse = await fetch('/api/users/me/referrals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setReferrals(historyData.data);
      }
    } catch (error) {
      message.error('Failed to load referral data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      message.success('Referral code copied to clipboard');
    }
  };

  const getShareUrl = (): string => {
    return `${window.location.origin}?ref=${referralCode}`;
  };

  const shareViaEmail = () => {
    const subject = 'Join me on MetaPharm Connect!';
    const body = `I'm using MetaPharm Connect for my healthcare needs. Use my referral code ${referralCode} to get rewards!\n\n${getShareUrl()}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSMS = () => {
    const text = `Join MetaPharm Connect using my referral code: ${referralCode} ${getShareUrl()}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  const shareViaWhatsApp = () => {
    const text = `Join MetaPharm Connect using my referral code: ${referralCode} ${getShareUrl()}`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const shareViaFacebook = () => {
    const url = getShareUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      'facebook-share-dialog',
      'width=800,height=600',
    );
  };

  const shareViaTwitter = () => {
    const text = `Join MetaPharm Connect using my referral code: ${referralCode}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getShareUrl())}`,
      'twitter-share-dialog',
      'width=800,height=600',
    );
  };

  const referralColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <code>{code}</code>,
    },
    {
      title: 'Referree',
      dataIndex: 'refereeName',
      key: 'refereeName',
      render: (name: string | null) => name || 'Pending invite',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'blue',
          completed: 'green',
          expired: 'red',
          cancelled: 'default',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Rewards Earned',
      dataIndex: 'rewardsEarned',
      key: 'rewardsEarned',
      render: (amount: number) => (
        <span>
          {amount > 0 ? `CHF ${amount.toFixed(2)}` : '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="referral-page loading-container">
        <Spin size="large" tip="Loading referral data..." />
      </div>
    );
  }

  return (
    <div className="referral-page">
      <div className="page-header">
        <h1>Referral Program</h1>
        <p className="subtitle">
          Share your referral code and earn rewards when your friends join MetaPharm Connect
        </p>
      </div>

      {/* Referral Code Card */}
      {referralCode && (
        <Card className="referral-code-card" bordered={false}>
          <div className="code-section">
            <h2>Your Referral Code</h2>
            <div className="code-display">
              <span className="code">{referralCode}</span>
              <Tooltip title="Copy to clipboard">
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={copyToClipboard}
                  className="copy-button"
                >
                  Copy
                </Button>
              </Tooltip>
            </div>

            <div className="share-options">
              <h3>Share Your Code</h3>
              <div className="button-group">
                <Tooltip title="Share via Email">
                  <Button
                    icon={<MailOutlined />}
                    onClick={shareViaEmail}
                    className="share-button"
                  >
                    Email
                  </Button>
                </Tooltip>

                <Tooltip title="Share via SMS">
                  <Button
                    icon={<PhoneOutlined />}
                    onClick={shareViaSMS}
                    className="share-button"
                  >
                    SMS
                  </Button>
                </Tooltip>

                <Tooltip title="Share via WhatsApp">
                  <Button
                    icon={<WhatsAppOutlined />}
                    onClick={shareViaWhatsApp}
                    className="share-button"
                  >
                    WhatsApp
                  </Button>
                </Tooltip>

                <Tooltip title="Share on Facebook">
                  <Button
                    icon={<FacebookOutlined />}
                    onClick={shareViaFacebook}
                    className="share-button"
                  >
                    Facebook
                  </Button>
                </Tooltip>

                <Tooltip title="Share on Twitter">
                  <Button
                    icon={<TwitterOutlined />}
                    onClick={shareViaTwitter}
                    className="share-button"
                  >
                    Twitter
                  </Button>
                </Tooltip>

                <Button
                  icon={<ShareAltOutlined />}
                  onClick={() => setShareModalVisible(true)}
                  className="share-button"
                >
                  More
                </Button>
              </div>

              <div className="share-url">
                <label>Share Link:</label>
                <Input
                  value={getShareUrl()}
                  readOnly
                  addonAfter={
                    <CopyOutlined
                      onClick={() => {
                        navigator.clipboard.writeText(getShareUrl());
                        message.success('Link copied');
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics */}
      {stats && <ReferralStats stats={stats} />}

      {/* Referral History */}
      <Card className="history-card" title="Referral History" bordered={false}>
        <Table
          columns={referralColumns}
          dataSource={referrals.map((r) => ({ ...r, key: r.id }))}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} referrals`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Share Modal */}
      <Modal
        title="Share Referral Code"
        visible={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="share-modal-content">
          <p>Your referral code: <code>{referralCode}</code></p>
          <p>Share your code with friends to earn rewards!</p>

          <div className="social-share">
            <Button block onClick={shareViaEmail} icon={<MailOutlined />} className="mb-2">
              Share via Email
            </Button>
            <Button block onClick={shareViaSMS} icon={<PhoneOutlined />} className="mb-2">
              Share via SMS
            </Button>
            <Button block onClick={shareViaWhatsApp} icon={<WhatsAppOutlined />} className="mb-2">
              Share via WhatsApp
            </Button>
            <Button block onClick={shareViaFacebook} icon={<FacebookOutlined />} className="mb-2">
              Share on Facebook
            </Button>
            <Button block onClick={shareViaTwitter} icon={<TwitterOutlined />}>
              Share on Twitter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReferralPage;
