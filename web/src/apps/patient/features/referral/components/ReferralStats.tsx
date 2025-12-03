/**
 * Referral Stats Component
 * Displays referral program statistics for the user
 * T6-024: Implement referral program for patient acquisition
 */

import React from 'react';
import { Card, Statistic, Progress } from 'antd';
import {
  UserAddOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import './ReferralStats.css';

interface ReferralStatsProps {
  stats: {
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalRewardsEarned: number;
    appliedRewardsValue: number;
    pendingRewardsValue: number;
  };
}

export const ReferralStats: React.FC<ReferralStatsProps> = ({ stats }) => {
  const conversionRate =
    stats.totalReferrals > 0
      ? Math.round((stats.completedReferrals / stats.totalReferrals) * 100)
      : 0;

  return (
    <div className="referral-stats">
      <Card className="stats-card" title="Your Referral Program Performance" bordered={false}>
        <div className="stats-row">
          {/* Total Referrals */}
          <div className="stat-col">
            <div className="stat-box total-referrals">
              <UserAddOutlined className="stat-icon" />
              <Statistic
                title="Total Referrals"
                value={stats.totalReferrals}
                valueStyle={{ color: '#1890ff' }}
              />
            </div>
          </div>

          {/* Pending Referrals */}
          <div className="stat-col">
            <div className="stat-box pending-referrals">
              <ClockCircleOutlined className="stat-icon" />
              <Statistic
                title="Pending"
                value={stats.pendingReferrals}
                valueStyle={{ color: '#faad14' }}
              />
            </div>
          </div>

          {/* Completed Referrals */}
          <div className="stat-col">
            <div className="stat-box completed-referrals">
              <CheckCircleOutlined className="stat-icon" />
              <Statistic
                title="Completed"
                value={stats.completedReferrals}
                valueStyle={{ color: '#52c41a' }}
              />
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="stat-col">
            <div className="stat-box conversion-rate">
              <Statistic
                title="Conversion Rate"
                value={conversionRate}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="rewards-row">
          <div className="reward-col">
            <div className="reward-box total-rewards">
              <div className="reward-header">
                <GiftOutlined className="reward-icon" />
                <h3>Total Rewards Earned</h3>
              </div>
              <div className="reward-amount">
                <span className="amount">CHF {stats.totalRewardsEarned.toFixed(2)}</span>
              </div>
              <div className="reward-breakdown">
                <div className="breakdown-item">
                  <span className="label">Applied:</span>
                  <span className="value applied">CHF {stats.appliedRewardsValue.toFixed(2)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Pending:</span>
                  <span className="value pending">CHF {stats.pendingRewardsValue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress to Next Milestone */}
          <div className="reward-col">
            <div className="milestone-box">
              <h3>Progress to Next Reward Milestone</h3>
              <div className="milestone-progress">
                {stats.completedReferrals < 3 && (
                  <>
                    <p className="milestone-label">
                      Complete {3 - stats.completedReferrals} more referral(s) to unlock bonus points!
                    </p>
                    <Progress
                      percent={(stats.completedReferrals / 3) * 100}
                      status={stats.completedReferrals >= 3 ? 'success' : 'active'}
                    />
                  </>
                )}
                {stats.completedReferrals >= 3 && stats.completedReferrals < 10 && (
                  <>
                    <p className="milestone-label">
                      Complete {10 - stats.completedReferrals} more referral(s) for VIP discount!
                    </p>
                    <Progress
                      percent={(stats.completedReferrals / 10) * 100}
                      status={stats.completedReferrals >= 10 ? 'success' : 'active'}
                    />
                  </>
                )}
                {stats.completedReferrals >= 10 && (
                  <>
                    <p className="milestone-label success">
                      You have reached the maximum referral reward level! Keep referring for more benefits.
                    </p>
                    <Progress percent={100} status="success" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Info */}
        <div className="benefits-info">
          <h3>How Referral Rewards Work</h3>
          <ul>
            <li>
              <strong>CHF 50</strong> in points for each successful referral (when referred friend completes
              purchase)
            </li>
            <li>
              <strong>CHF 20</strong> in points given to your referred friend as a welcome bonus
            </li>
            <li>Rewards are credited as bonus points to your VIP account</li>
            <li>Points can be used for discounts on future orders</li>
            <li>Referral codes expire after 90 days of inactivity</li>
            <li>
              <strong>Special bonuses:</strong> 3 referrals = 500 bonus points, 10 referrals = 10% discount
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ReferralStats;
