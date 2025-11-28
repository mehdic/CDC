/**
 * Address Form Component
 * T3-039: Checkout Frontend - Address selection/entry form
 */

import React, { useState } from 'react';

export interface Address {
  id?: string;
  type?: 'home' | 'work' | 'other';
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface AddressFormProps {
  addresses?: Address[];
  selectedAddress?: Address;
  onAddressSelect: (address: Address) => void;
  onAddNewAddress?: (address: Address) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  addresses = [],
  selectedAddress,
  onAddressSelect,
  onAddNewAddress,
}) => {
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({
    street: '',
    city: '',
    postalCode: '',
    country: 'Switzerland',
    type: 'home',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAddress = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newAddress.street.trim()) {
      newErrors.street = 'Rue est requise';
    }
    if (!newAddress.city.trim()) {
      newErrors.city = 'Ville est requise';
    }
    if (!newAddress.postalCode.trim()) {
      newErrors.postalCode = 'Code postal est requis';
    } else if (!/^\d{4}$/.test(newAddress.postalCode)) {
      newErrors.postalCode = 'Code postal invalide (4 chiffres requis)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveNewAddress = () => {
    if (validateAddress() && onAddNewAddress) {
      onAddNewAddress(newAddress);
      setShowNewAddressForm(false);
      setNewAddress({
        street: '',
        city: '',
        postalCode: '',
        country: 'Switzerland',
        type: 'home',
      });
      setErrors({});
    }
  };

  return (
    <div className="address-form" data-testid="address-form">
      <h3 className="form-title">Adresse de livraison</h3>

      {/* Existing addresses */}
      {addresses.length > 0 && !showNewAddressForm && (
        <div className="address-list">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`address-card ${selectedAddress?.id === address.id ? 'selected' : ''}`}
              onClick={() => onAddressSelect(address)}
              data-testid={`address-${address.id}`}
              data-selected={selectedAddress?.id === address.id}
            >
              <div className="address-content">
                <div className="address-type">
                  {address.type === 'home' ? '🏠 Domicile' : address.type === 'work' ? '🏢 Travail' : '📍 Autre'}
                  {address.isDefault && <span className="default-badge">Par défaut</span>}
                </div>
                <div className="address-details">
                  <div>{address.street}</div>
                  <div>{address.postalCode} {address.city}</div>
                  <div>{address.country}</div>
                </div>
              </div>
              <div className="radio-indicator">
                {selectedAddress?.id === address.id && (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new address button */}
      {!showNewAddressForm && (
        <button
          className="btn-add-address"
          onClick={() => setShowNewAddressForm(true)}
          data-testid="btn-add-address"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Ajouter une nouvelle adresse
        </button>
      )}

      {/* New address form */}
      {showNewAddressForm && (
        <div className="new-address-form" data-testid="new-address-form">
          <div className="form-group">
            <label htmlFor="street">Rue *</label>
            <input
              type="text"
              id="street"
              value={newAddress.street}
              onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
              className={errors.street ? 'error' : ''}
              data-testid="street-input"
              placeholder="123 Rue de la Paix"
            />
            {errors.street && <span className="error-message" data-testid="error-street">{errors.street}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="postal">Code postal *</label>
              <input
                type="text"
                id="postal"
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className={errors.postalCode ? 'error' : ''}
                data-testid="postal-input"
                placeholder="1200"
                maxLength={4}
              />
              {errors.postalCode && <span className="error-message" data-testid="error-postal">{errors.postalCode}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="city">Ville *</label>
              <input
                type="text"
                id="city"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className={errors.city ? 'error' : ''}
                data-testid="city-input"
                placeholder="Geneva"
              />
              {errors.city && <span className="error-message" data-testid="error-city">{errors.city}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="country">Pays</label>
            <select
              id="country"
              value={newAddress.country}
              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
              data-testid="country-select"
            >
              <option value="Switzerland">Suisse</option>
              <option value="France">France</option>
              <option value="Germany">Allemagne</option>
              <option value="Italy">Italie</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="type">Type d&apos;adresse</label>
            <select
              id="type"
              value={newAddress.type}
              onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value as Address['type'] })}
              data-testid="type-select"
            >
              <option value="home">Domicile</option>
              <option value="work">Travail</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowNewAddressForm(false);
                setErrors({});
              }}
              data-testid="btn-cancel"
            >
              Annuler
            </button>
            <button
              className="btn-primary"
              onClick={handleSaveNewAddress}
              data-testid="btn-save-address"
            >
              Enregistrer l&apos;adresse
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .address-form {
          padding: 1.5rem;
        }

        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #111827;
        }

        .address-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .address-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .address-card:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .address-card.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .address-content {
          flex: 1;
        }

        .address-type {
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .default-badge {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          background-color: #10b981;
          color: white;
          border-radius: 12px;
        }

        .address-details {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .radio-indicator {
          width: 24px;
          height: 24px;
          color: #3b82f6;
        }

        .btn-add-address {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-address:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .btn-add-address svg {
          width: 20px;
          height: 20px;
        }

        .new-address-form {
          background-color: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1rem;
        }

        label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        input,
        select {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        input:focus,
        select:focus {
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

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 0.75rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border: none;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
};
