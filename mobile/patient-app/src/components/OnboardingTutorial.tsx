import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * T2-055: Onboarding Tutorials for New Users
 * Interactive walkthroughs with step-by-step guidance
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  tips?: string[];
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface OnboardingTutorialProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
  title?: string;
  description?: string;
}

/**
 * Full screen onboarding carousel
 */
export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  steps,
  onComplete,
  onSkip,
  title,
  description,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get('window').width;
  const step = steps[currentStep];

  // Animate progress
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: ((currentStep + 1) / steps.length) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, steps.length]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollRef.current?.scrollTo({
        x: (currentStep + 1) * screenWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({
        x: (currentStep - 1) * screenWidth,
        animated: true,
      });
    }
  };

  const progressPercentage = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const a11yLabel = `Step ${currentStep + 1} of ${steps.length}: ${step.title}`;

  return (
    <View style={styles.container} accessible accessibilityLabel={a11yLabel}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        {title && <Text style={styles.headerTitle}>{title}</Text>}
        <View style={styles.spacer} />
      </View>

      {/* Progress Bar */}
      <Animated.View
        style={[
          styles.progressBarBackground,
          {
            width: progressPercentage,
          },
        ]}
      />

      {/* Steps Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.stepsContainer}
      >
        {steps.map((s) => (
          <View
            key={s.id}
            style={[styles.stepContainer, { width: screenWidth }]}
            accessible
            accessibilityLabel={`${s.title}: ${s.description}`}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={s.icon}
                size={80}
                color="#00897b"
              />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDescription}>{s.description}</Text>

              {/* Tips */}
              {s.tips && s.tips.length > 0 && (
                <View style={styles.tipsContainer}>
                  {s.tips.map((tip, idx) => (
                    <View
                      key={idx}
                      style={styles.tipItem}
                      accessible
                      accessibilityLabel={`Tip: ${tip}`}
                    >
                      <MaterialCommunityIcons
                        name="lightbulb-on"
                        size={16}
                        color="#ff9800"
                        style={styles.tipIcon}
                      />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Custom Action Button */}
              {s.action && (
                <Button
                  mode="contained"
                  onPress={s.action.onPress}
                  style={styles.actionButton}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={s.action.label}
                >
                  {s.action.label}
                </Button>
              )}
            </View>

            {/* Step Indicators */}
            <View style={styles.stepIndicators}>
              {steps.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicatorDot,
                    idx === currentStep && styles.indicatorDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentStep === 0}
          style={styles.navButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Previous step"
        >
          Previous
        </Button>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.navButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            currentStep === steps.length - 1
              ? 'Complete onboarding'
              : 'Next step'
          }
        >
          {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

/**
 * Tooltip helper for highlighting UI elements during onboarding
 */
interface OnboardingHighlightProps {
  visible: boolean;
  title: string;
  description: string;
  targetRect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  position?: 'top' | 'bottom' | 'left' | 'right';
  onDismiss: () => void;
}

export const OnboardingHighlight: React.FC<OnboardingHighlightProps> = ({
  visible,
  title,
  description,
  targetRect,
  position = 'bottom',
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.highlightOverlay, { opacity: fadeAnim }]}
      pointerEvents="none"
    >
      {/* Semi-transparent background */}
      <View style={styles.highlightBackground} />

      {/* Highlight box */}
      {targetRect && (
        <View
          style={[
            styles.highlightBox,
            {
              left: targetRect.x,
              top: targetRect.y,
              width: targetRect.width,
              height: targetRect.height,
            },
          ]}
        />
      )}

      {/* Tooltip */}
      <View
        style={[
          styles.tooltip,
          position === 'top' && styles.tooltipTop,
          position === 'bottom' && styles.tooltipBottom,
          position === 'left' && styles.tooltipLeft,
          position === 'right' && styles.tooltipRight,
        ]}
      >
        <Text style={styles.tooltipTitle}>{title}</Text>
        <Text style={styles.tooltipDescription}>{description}</Text>

        <TouchableOpacity
          onPress={onDismiss}
          style={styles.tooltipButton}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Close tutorial"
        >
          <Text style={styles.tooltipButtonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

/**
 * Multi-step inline tutorial component
 */
interface InlineTutorialProps {
  steps: OnboardingStep[];
  onComplete: () => void;
}

export const InlineTutorial: React.FC<InlineTutorialProps> = ({
  steps,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.inlineTutorialContainer}>
      <View style={styles.inlineTutorialContent}>
        <View style={styles.inlineTutorialHeader}>
          <Text style={styles.inlineTutorialTitle}>
            Tips & Tricks
          </Text>
          <TouchableOpacity
            onPress={onComplete}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Close tips"
          >
            <MaterialCommunityIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inlineTutorialBody}>
          <MaterialCommunityIcons
            name={step.icon}
            size={40}
            color="#00897b"
            style={styles.inlineTutorialIcon}
          />
          <Text style={styles.inlineTutorialStepTitle}>{step.title}</Text>
          <Text style={styles.inlineTutorialStepDescription}>
            {step.description}
          </Text>
        </View>

        <View style={styles.inlineTutorialFooter}>
          <View style={styles.inlineTutorialProgress}>
            {steps.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressDot,
                  idx === currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <Button
            mode="contained"
            onPress={handleNext}
            compact
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              currentStep === steps.length - 1
                ? 'Complete tips'
                : 'Next tip'
            }
          >
            {currentStep === steps.length - 1 ? 'Done' : 'Next'}
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#00897b',
    fontSize: 14,
    fontWeight: '500',
  },
  spacer: {
    width: 40,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: '#00897b',
  },
  stepsContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  tipsContainer: {
    marginVertical: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  actionButton: {
    marginTop: 12,
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#00897b',
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  highlightBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  highlightBox: {
    borderWidth: 2,
    borderColor: '#00897b',
    borderRadius: 8,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipTop: {
    bottom: '10%',
  },
  tooltipBottom: {
    top: '10%',
  },
  tooltipLeft: {
    right: '10%',
  },
  tooltipRight: {
    left: '10%',
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tooltipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#00897b',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tooltipButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  inlineTutorialContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  inlineTutorialContent: {
    backgroundColor: '#fff',
  },
  inlineTutorialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  inlineTutorialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inlineTutorialBody: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  inlineTutorialIcon: {
    marginBottom: 12,
  },
  inlineTutorialStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  inlineTutorialStepDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  inlineTutorialFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineTutorialProgress: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#00897b',
  },
});
