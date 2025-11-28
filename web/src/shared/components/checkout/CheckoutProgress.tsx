/**
 * Checkout Progress Stepper
 * T3-039: Checkout Frontend - Progress indicator component
 */

import React from 'react';

export interface CheckoutStep {
  id: number;
  label: string;
  completed: boolean;
}

export interface CheckoutProgressProps {
  currentStep: number;
  steps: CheckoutStep[];
}

export const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="checkout-progress" data-testid="checkout-progress">
      <div className="stepper-container">
        {steps.map((step, index) => (
          <div key={step.id} className="step-wrapper">
            <div className="step-item">
              <div
                className={`step-circle ${
                  index < currentStep
                    ? 'completed'
                    : index === currentStep
                    ? 'active'
                    : 'pending'
                }`}
                data-testid={`step-${step.id}`}
              >
                {index < currentStep ? (
                  <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`step-connector ${index < currentStep ? 'completed' : 'pending'}`}
              />
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .checkout-progress {
          padding: 2rem 0;
          margin-bottom: 2rem;
        }

        .stepper-container {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          max-width: 800px;
          margin: 0 auto;
        }

        .step-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .step-circle.pending {
          background-color: #e5e7eb;
          color: #6b7280;
          border: 2px solid #e5e7eb;
        }

        .step-circle.active {
          background-color: #3b82f6;
          color: white;
          border: 2px solid #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .step-circle.completed {
          background-color: #10b981;
          color: white;
          border: 2px solid #10b981;
        }

        .check-icon {
          width: 20px;
          height: 20px;
        }

        .step-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          text-align: center;
          white-space: nowrap;
        }

        .step-connector {
          flex: 1;
          height: 2px;
          margin: 0 8px;
          margin-bottom: 24px;
          transition: background-color 0.3s ease;
        }

        .step-connector.pending {
          background-color: #e5e7eb;
        }

        .step-connector.completed {
          background-color: #10b981;
        }

        @media (max-width: 768px) {
          .stepper-container {
            flex-direction: column;
            align-items: stretch;
          }

          .step-wrapper {
            flex-direction: row;
            align-items: flex-start;
          }

          .step-item {
            flex-direction: row;
            align-items: center;
            gap: 1rem;
          }

          .step-connector {
            width: 2px;
            height: 40px;
            margin: 8px 0 8px 19px;
          }

          .step-label {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};
