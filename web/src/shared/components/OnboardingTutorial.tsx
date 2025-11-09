/**
 * OnboardingTutorial Component (T276) - Web Version
 * Role-specific onboarding tutorials for first-time users
 * Supports patient, pharmacist, doctor, nurse, delivery roles
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { t } from '../utils/i18n';

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
  image?: string; // Image URL
  icon?: React.ReactNode;
}

/**
 * OnboardingTutorial props
 */
export interface OnboardingTutorialProps {
  open: boolean;
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
  return `metapharm:onboarding:${role}`;
};

/**
 * Check if onboarding has been completed for a role
 */
export const hasCompletedOnboarding = (role: UserRole): boolean => {
  try {
    const value = localStorage.getItem(getOnboardingStorageKey(role));
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const markOnboardingComplete = (role: UserRole): void => {
  try {
    localStorage.setItem(getOnboardingStorageKey(role), 'true');
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
};

/**
 * Reset onboarding status (for testing)
 */
export const resetOnboarding = (role: UserRole): void => {
  try {
    localStorage.removeItem(getOnboardingStorageKey(role));
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
  open,
  role,
  onComplete,
  onSkip,
  customSteps,
  showDontShowAgain = true,
  testID,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = customSteps || getDefaultSteps(role);
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

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

  const handleSkip = () => {
    if (dontShowAgain) {
      markOnboardingComplete(role);
    }
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const handleComplete = () => {
    if (dontShowAgain || isLastStep) {
      markOnboardingComplete(role);
    }
    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      data-testid={testID}
      aria-labelledby="onboarding-dialog-title"
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" id="onboarding-dialog-title">
          {t('onboarding.welcome')}
        </Typography>
        <IconButton
          onClick={handleSkip}
          size="small"
          aria-label={t('common.skip')}
          data-testid={`${testID}-skip`}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Progress */}
      <Box sx={{ px: 2, pt: 2 }}>
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {currentStep + 1} / {totalSteps}
        </Typography>
      </Box>

      {/* Content */}
      <DialogContent sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', px: 3 }}>
          {/* Image or Icon */}
          {currentStepData.image && (
            <Box
              component="img"
              src={currentStepData.image}
              alt={currentStepData.title}
              sx={{
                maxWidth: '70%',
                height: 'auto',
                mx: 'auto',
                mb: 3,
              }}
            />
          )}
          {currentStepData.icon && (
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              {currentStepData.icon}
            </Box>
          )}

          {/* Title */}
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {currentStepData.title}
          </Typography>

          {/* Description */}
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {currentStepData.description}
          </Typography>
        </Box>

        {/* Stepper (dots) */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 1 }}>
          {steps.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor:
                  index === currentStep ? 'primary.main' : 'action.disabled',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </Box>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          flexDirection: 'column',
          alignItems: 'stretch',
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Don't show again checkbox */}
        {showDontShowAgain && isLastStep && (
          <FormControlLabel
            control={
              <Checkbox
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                data-testid={`${testID}-dont-show-again`}
              />
            }
            label={t('onboarding.dontShowAgain')}
            sx={{ mb: 2 }}
          />
        )}

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
          {currentStep > 0 && (
            <Button
              variant="outlined"
              onClick={handlePrevious}
              sx={{ flex: 1 }}
              data-testid={`${testID}-previous`}
            >
              {t('common.previous')}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ flex: 1 }}
            data-testid={`${testID}-next`}
          >
            {isLastStep ? t('onboarding.getStarted') : t('common.next')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Export component
 */
export default OnboardingTutorial;
