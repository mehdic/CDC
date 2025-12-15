/**
 * BonusProgressCard Component
 * Displays active bonuses and progress tracking
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, FlatList } from 'react-native';

export interface BonusItem {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  reward: number;
  expiresAt: string;
}

export interface BonusProgressCardProps {
  bonuses: BonusItem[];
  style?: ViewStyle;
  testID?: string;
}

/**
 * BonusProgressCard Component
 * Shows active bonuses with progress bars and rewards
 */
export const BonusProgressCard: React.FC<BonusProgressCardProps> = ({
  bonuses,
  style,
  testID = 'bonus-progress-card',
}) => {
  const getProgressPercentage = (current: number, target: number): number => {
    if (target === 0) {return 0;}
    return Math.min((current / target) * 100, 100);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {return 'Expired';}
      if (diffDays === 0) {return 'Today';}
      if (diffDays === 1) {return 'Tomorrow';}
      if (diffDays < 7) {return `${diffDays} days left`;}
      return `${Math.ceil(diffDays / 7)} weeks left`;
    } catch {
      return 'Expires soon';
    }
  };

  const BonusItemComponent: React.FC<{ item: BonusItem; index: number }> = ({ item, index }) => {
    const progressPercentage = getProgressPercentage(item.current, item.target);

    return (
      <View
        style={styles.bonusItem}
        testID={`${testID}-bonus-${index}`}
      >
        <View style={styles.bonusHeader} testID={`${testID}-bonus-header-${index}`}>
          <View style={styles.bonusInfo}>
            <Text style={styles.bonusTitle} testID={`${testID}-bonus-title-${index}`}>
              {item.title}
            </Text>
            <Text style={styles.bonusDescription} testID={`${testID}-bonus-description-${index}`}>
              {item.description}
            </Text>
          </View>
          <View style={styles.bonusReward} testID={`${testID}-bonus-reward-${index}`}>
            <Text style={styles.rewardAmount} testID={`${testID}-reward-amount-${index}`}>
              +CHF
            </Text>
            <Text style={styles.rewardValue} testID={`${testID}-reward-value-${index}`}>
              {item.reward.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer} testID={`${testID}-progress-${index}`}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              testID={`${testID}-progress-fill-${index}`}
            />
          </View>
          <Text style={styles.progressText} testID={`${testID}-progress-text-${index}`}>
            {item.current} / {item.target} {item.unit}
          </Text>
        </View>

        <View style={styles.bonusFooter} testID={`${testID}-bonus-footer-${index}`}>
          <Text
            style={styles.expiryText}
            testID={`${testID}-expiry-text-${index}`}
          >
            {formatDate(item.expiresAt)}
          </Text>
          {progressPercentage === 100 && (
            <Text style={styles.completeText} testID={`${testID}-complete-text-${index}`}>
              ✓ Complete
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (bonuses.length === 0) {
    return (
      <View style={[styles.card, style]} testID={testID}>
        <Text style={styles.cardTitle} testID={`${testID}-title`}>
          Active Bonuses
        </Text>
        <View style={styles.emptyContainer} testID={`${testID}-empty`}>
          <Text style={styles.emptyText} testID={`${testID}-empty-text`}>
            No active bonuses available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]} testID={testID}>
      <Text style={styles.cardTitle} testID={`${testID}-title`}>
        Active Bonuses
      </Text>

      <FlatList
        data={bonuses}
        renderItem={({ item, index }) => <BonusItemComponent item={item} index={index} />}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        testID={`${testID}-list`}
      />

      <View style={styles.infoContainer} testID={`${testID}-info`}>
        <Text style={styles.infoText} testID={`${testID}-info-text`}>
          Complete bonuses to earn extra rewards!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bonusItem: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bonusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bonusInfo: {
    flex: 1,
    marginRight: 12,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  bonusDescription: {
    fontSize: 12,
    color: '#666',
  },
  bonusReward: {
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rewardAmount: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
  rewardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  bonusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
  },
  completeText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  infoContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default BonusProgressCard;
