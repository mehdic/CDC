/**
 * Payment Method Component
 * T3-039: Checkout Frontend - Payment method selection and card input
 */

import React, { useState } from 'react';

export interface PaymentMethodOption {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface PaymentMethodProps {
  methods: PaymentMethodOption[];
  selectedMethod?: PaymentMethodOption;
  onMethodSelect: (method: PaymentMethodOption) => void;
  onCardDetailsChange?: (details: CardDetails) => void;
}

export interface CardDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  methods,
  selectedMethod,
  onMethodSelect,
  onCardDetailsChange,
}) => {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getMethodIcon = (iconName: string): string => {
    const icons: Record<string, string> = {
      card: '💳',
      bank: '🏦',
      paypal: '💰',
      invoice: '📄',
    };
    return icons[iconName] || '💳';
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiry = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateExpiry = (expiry: string): boolean => {
    const [month, year] = expiry.split('/');
    if (!month || !year) return false;
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(`20${year}`, 10);
    const now = new Date();
    const expiryDate = new Date(yearNum, monthNum - 1);
    return monthNum >= 1 && monthNum <= 12 && expiryDate > now;
  };

  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (cleaned.length <= 16 && /^\d*$/.test(cleaned)) {
      const formatted = formatCardNumber(cleaned);
      const newDetails = { ...cardDetails, cardNumber: formatted };
      setCardDetails(newDetails);
      if (onCardDetailsChange) {
        onCardDetailsChange(newDetails);
      }

      // Validate
      if (cleaned.length === 16) {
        if (!validateCardNumber(formatted)) {
          setErrors({ ...errors, cardNumber: 'Numéro de carte invalide' });
        } else {
          const newErrors = { ...errors };
          delete newErrors.cardNumber;
          setErrors(newErrors);
        }
      }
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      const formatted = formatExpiry(cleaned);
      const newDetails = { ...cardDetails, expiry: formatted };
      setCardDetails(newDetails);
      if (onCardDetailsChange) {
        onCardDetailsChange(newDetails);
      }

      // Validate
      if (formatted.length === 5) {
        if (!validateExpiry(formatted)) {
          setErrors({ ...errors, expiry: 'Date d\'expiration invalide' });
        } else {
          const newErrors = { ...errors };
          delete newErrors.expiry;
          setErrors(newErrors);
        }
      }
    }
  };

  const handleCVVChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      const newDetails = { ...cardDetails, cvv: value };
      setCardDetails(newDetails);
      if (onCardDetailsChange) {
        onCardDetailsChange(newDetails);
      }

      // Validate
      if (value.length === 3 || value.length === 4) {
        if (!validateCVV(value)) {
          setErrors({ ...errors, cvv: 'CVV invalide' });
        } else {
          const newErrors = { ...errors };
          delete newErrors.cvv;
          setErrors(newErrors);
        }
      }
    }
  };

  const handleCardholderNameChange = (value: string) => {
    const newDetails = { ...cardDetails, cardholderName: value };
    setCardDetails(newDetails);
    if (onCardDetailsChange) {
      onCardDetailsChange(newDetails);
    }
  };

  return (
    <div className="payment-method" data-testid="payment-method">
      <h3 className="form-title">Moyen de paiement</h3>

      <div className="payment-methods-list">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`payment-option ${selectedMethod?.id === method.id ? 'selected' : ''}`}
            onClick={() => onMethodSelect(method)}
            data-testid={`payment-${method.id}`}
          >
            <div className="option-icon">{getMethodIcon(method.icon)}</div>
            <div className="option-content">
              <div className="option-name">{method.name}</div>
              {method.description && (
                <div className="option-description">{method.description}</div>
              )}
            </div>
            <div className="radio-indicator">
              <div className={`radio-circle ${selectedMethod?.id === method.id ? 'selected' : ''}`}>
                {selectedMethod?.id === method.id && <div className="radio-dot" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card payment form */}
      {selectedMethod?.id === 'card' && (
        <div className="card-form" data-testid="card-payment-form">
          <div className="form-group">
            <label htmlFor="cardholder-name">Titulaire de la carte *</label>
            <input
              type="text"
              id="cardholder-name"
              value={cardDetails.cardholderName}
              onChange={(e) => handleCardholderNameChange(e.target.value)}
              placeholder="Jean Dupont"
              data-testid="cardholder-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="card-number">Numéro de carte *</label>
            <input
              type="text"
              id="card-number"
              value={cardDetails.cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              placeholder="1234 5678 9012 3456"
              className={errors.cardNumber ? 'error' : ''}
              data-testid="card-number"
              maxLength={19}
            />
            {errors.cardNumber && (
              <span className="error-message" data-testid="error-card-number">
                {errors.cardNumber}
              </span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiry">Expiration *</label>
              <input
                type="text"
                id="expiry"
                value={cardDetails.expiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                placeholder="MM/YY"
                className={errors.expiry ? 'error' : ''}
                data-testid="card-expiry"
                maxLength={5}
              />
              {errors.expiry && (
                <span className="error-message" data-testid="error-expiry">
                  {errors.expiry}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="cvv">CVV *</label>
              <input
                type="text"
                id="cvv"
                value={cardDetails.cvv}
                onChange={(e) => handleCVVChange(e.target.value)}
                placeholder="123"
                className={errors.cvv ? 'error' : ''}
                data-testid="card-cvv"
                maxLength={4}
              />
              {errors.cvv && (
                <span className="error-message" data-testid="error-cvv">
                  {errors.cvv}
                </span>
              )}
            </div>
          </div>

          <div className="security-notice">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Paiement sécurisé - Vos données sont cryptées</span>
          </div>
        </div>
      )}

      {/* Bank transfer info */}
      {selectedMethod?.id === 'bank' && (
        <div className="bank-details" data-testid="bank-details">
          <div className="info-box">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p><strong>Les détails de virement bancaire seront envoyés par e-mail après confirmation de la commande.</strong></p>
              <p className="small-text">Le paiement doit être effectué dans les 3 jours ouvrables.</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .payment-method {
          padding: 1.5rem;
        }

        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #111827;
        }

        .payment-methods-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .payment-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .payment-option:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .payment-option.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .option-icon {
          font-size: 1.5rem;
          min-width: 40px;
          text-align: center;
        }

        .option-content {
          flex: 1;
        }

        .option-name {
          font-weight: 600;
          color: #111827;
        }

        .option-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .radio-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .radio-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .radio-circle.selected {
          border-color: #3b82f6;
        }

        .radio-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #3b82f6;
        }

        .card-form {
          background-color: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
        }

        label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #374151;
          font-size: 0.875rem;
        }

        input {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        input.error {
          border-color: #ef4444;
        }

        .error-message {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #ef4444;
        }

        .security-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 0.75rem;
          background-color: #ecfdf5;
          border-radius: 6px;
          color: #047857;
          font-size: 0.75rem;
        }

        .security-notice svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .bank-details {
          margin-top: 1rem;
        }

        .info-box {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          border-radius: 4px;
        }

        .info-box svg {
          width: 24px;
          height: 24px;
          color: #3b82f6;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .info-box p {
          margin: 0;
          color: #1e40af;
          font-size: 0.875rem;
        }

        .small-text {
          margin-top: 0.5rem !important;
          font-size: 0.75rem !important;
          color: #6b7280 !important;
        }
      `}</style>
    </div>
  );
};
