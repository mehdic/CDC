/**
 * OnboardingTutorial Component (T276)
 * Role-specific onboarding tutorials for first-time users
 * Supports patient, pharmacist, doctor, nurse, delivery roles
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '../utils/i18n';
import { Button } from './Button';

/**
 * User role type
 */
export type UserRole = 'patient' | 'pharmacist' | 'doctor' | 'nurse' | 'delivery';

/**
 * Tutorial step
 */
export interface TutorialStep {
  title: string;
  description: string;
  image?: any; // Image source (require('./image.png'))
  icon?: React.ReactNode;
}

/**
 * OnboardingTutorial props
 */
export interface OnboardingTutorialProps {
  visible: boolean;
  role: UserRole;
  onComplete: () => void;
  onSkip?: () => void;
  customSteps?: TutorialStep[];
  showDontShowAgain?: boolean;
  testID?: string;
}

/**
 * Storage key for onboarding completion
 */
const getOnboardingStorageKey = (role: UserRole): string => {
  return `@metapharm:onboarding:${role}`;
};

/**
 * Check if onboarding has been completed for a role
 */
export const hasCompletedOnboarding = async (role: UserRole): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(getOnboardingStorageKey(role));
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const markOnboardingComplete = async (role: UserRole): Promise<void> => {
  try {
    await AsyncStorage.setItem(getOnboardingStorageKey(role), 'true');
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
};

/**
 * Reset onboarding status (for testing)
 */
export const resetOnboarding = async (role: UserRole): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getOnboardingStorageKey(role));
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
};

/**
 * Get default tutorial steps for a role
 */
const getDefaultSteps = (role: UserRole): TutorialStep[] => {
  const steps: TutorialStep[] = [];

  switch (role) {
    case 'patient':
      steps.push(
        {
          title: t('onboarding.patient.step1Title'),
          description: t('onboarding.patient.step1Description'),
        },
        {
          title: t('onboarding.patient.step2Title'),
          description: t('onboarding.patient.step2Description'),
        },
        {
          title: t('onboarding.patient.step3Title'),
          description: t('onboarding.patient.step3Description'),
        },
        {
          title: t('onboarding.patient.step4Title'),
          description: t('onboarding.patient.step4Description'),
        }
      );
      break;

    case 'pharmacist':
      steps.push(
        {
          title: t('onboarding.pharmacist.step1Title'),
          description: t('onboarding.pharmacist.step1Description'),
        },
        {
          title: t('onboarding.pharmacist.step2Title'),
          description: t('onboarding.pharmacist.step2Description'),
        },
        {
          title: t('onboarding.pharmacist.step3Title'),
          description: t('onboarding.pharmacist.step3Description'),
        },
        {
          title: t('onboarding.pharmacist.step4Title'),
          description: t('onboarding.pharmacist.step4Description'),
        }
      );
      break;

    case 'doctor':
      steps.push(
        {
          title: t('onboarding.doctor.step1Title'),
          description: t('onboarding.doctor.step1Description'),
        },
        {
          title: t('onboarding.doctor.step2Title'),
          description: t('onboarding.doctor.step2Description'),
        },
        {
          title: t('onboarding.doctor.step3Title'),
          description: t('onboarding.doctor.step3Description'),
        }
      );
      break;

    case 'nurse':
      steps.push(
        {
          title: t('onboarding.nurse.step1Title'),
          description: t('onboarding.nurse.step1Description'),
        },
        {
          title: t('onboarding.nurse.step2Title'),
          description: t('onboarding.nurse.step2Description'),
        },
        {
          title: t('onboarding.nurse.step3Title'),
          description: t('onboarding.nurse.step3Description'),
        }
      );
      break;

    case 'delivery':
      steps.push(
        {
          title: t('onboarding.delivery.step1Title'),
          description: t('onboarding.delivery.step1Description'),
        },
        {
          title: t('onboarding.delivery.step2Title'),
          description: t('onboarding.delivery.step2Description'),
        },
        {
          title: t('onboarding.delivery.step3Title'),
          description: t('onboarding.delivery.step3Description'),
        }
      );
      break;
  }

  return steps;
};

/**
 * OnboardingTutorial Component
 */
export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  visible,
  role,
  onComplete,
  onSkip,
  customSteps,
  showDontShowAgain = true,
  testID,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const steps = customSteps || getDefaultSteps(role);
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;

  // Animate on step change
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [currentStep, visible]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (dontShowAgain) {
      await markOnboardingComplete(role);
    }
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const handleComplete = async () => {
    if (dontShowAgain || isLastStep) {
      await markOnboardingComplete(role);
    }
    onComplete();
  };

  if (!visible) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      testID={testID}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{t('onboarding.welcome')}</Text>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            testID={`${testID}-skip`}
            accessibilityRole="button"
            accessibilityLabel={t('common.skip')}
          >
            <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} / {totalSteps}
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Image or Icon */}
            {currentStepData.image && (
              <Image source={currentStepData.image} style={styles.stepImage} />
            )}
            {currentStepData.icon && (
              <View style={styles.stepIcon}>{currentStepData.icon}</View>
            )}

            {/* Title */}
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>

            {/* Description */}
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Don't show again checkbox */}
          {showDontShowAgain && isLastStep && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setDontShowAgain(!dontShowAgain)}
              testID={`${testID}-dont-show-again`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: dontShowAgain }}
              accessibilityLabel={t('onboarding.dontShowAgain')}
            >
              <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{t('onboarding.dontShowAgain')}</Text>
            </TouchableOpacity>
          )}

          {/* Navigation buttons */}
          <View style={styles.navigationButtons}>
            {currentStep > 0 && (
              <Button
                title={t('common.previous')}
                onPress={handlePrevious}
                variant="outline"
                size="medium"
                style={styles.navButton}
                testID={`${testID}-previous`}
              />
            )}
            <Button
              title={isLastStep ? t('onboarding.getStarted') : t('common.next')}
              onPress={handleNext}
              variant="primary"
              size="medium"
              style={styles.navButton}
              fullWidth={currentStep === 0}
              testID={`${testID}-next`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Styles
 */
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  stepImage: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
    marginBottom: 32,
  },
  stepIcon: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#212529',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
});

/**
 * Export component
 */
export default OnboardingTutorial;
