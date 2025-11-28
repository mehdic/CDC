/**
 * Checkout Page
 * T3-039: Checkout Frontend - Main checkout wizard with 5 steps
 * T3-041: Order Confirmation Flow
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutProgress, CheckoutStep } from '@shared/components/checkout/CheckoutProgress';
import { AddressForm, Address } from '@shared/components/checkout/AddressForm';
import { DeliveryOptions, DeliveryMethod } from '@shared/components/checkout/DeliveryOptions';
import { PaymentMethod, PaymentMethodOption, CardDetails } from '@shared/components/checkout/PaymentMethod';
import { OrderReview } from '@shared/components/checkout/OrderReview';
import { useCart } from '@shared/hooks/useCart';

const CHECKOUT_STEPS: CheckoutStep[] = [
  { id: 1, label: 'Adresse', completed: false },
  { id: 2, label: 'Livraison', completed: false },
  { id: 3, label: 'Paiement', completed: false },
  { id: 4, label: 'Révision', completed: false },
  { id: 5, label: 'Confirmation', completed: false },
];

// Mock data - In real app, these would come from API
const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr_001',
    type: 'home',
    street: '123 Rue de la Paix',
    city: 'Geneva',
    postalCode: '1200',
    country: 'Switzerland',
    isDefault: true,
  },
  {
    id: 'addr_002',
    type: 'work',
    street: '456 Avenue de la République',
    city: 'Zurich',
    postalCode: '8000',
    country: 'Switzerland',
    isDefault: false,
  },
];

const MOCK_DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: 'standard',
    name: 'Livraison Standard',
    description: '2-3 jours ouvrables',
    cost: 5.0,
    estimatedDelivery: 3,
  },
  {
    id: 'express',
    name: 'Livraison Express',
    description: 'Livraison le lendemain',
    cost: 15.0,
    estimatedDelivery: 1,
  },
  {
    id: 'pickup',
    name: 'Retrait en pharmacie',
    description: 'Disponible immédiatement',
    cost: 0,
    estimatedDelivery: 0,
  },
];

const MOCK_PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'card', name: 'Carte bancaire', icon: 'card' },
  { id: 'bank', name: 'Virement bancaire', icon: 'bank' },
  { id: 'paypal', name: 'PayPal', icon: 'paypal' },
];

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { data: cartResponse, isLoading } = useCart();
  const cart = cartResponse?.cart;

  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(CHECKOUT_STEPS);

  // Form state
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [selectedAddress, setSelectedAddress] = useState<Address | undefined>(
    MOCK_ADDRESSES.find((a) => a.isDefault)
  );
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodOption | undefined>();
  const [cardDetails, setCardDetails] = useState<CardDetails>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoading && (!cart || cart.itemCount === 0)) {
      navigate('/ecommerce');
    }
  }, [cart, isLoading, navigate]);

  const handleAddNewAddress = (address: Address) => {
    const newAddress = {
      ...address,
      id: `addr_${Date.now()}`,
    };
    setAddresses([...addresses, newAddress]);
    setSelectedAddress(newAddress);
  };

  const handleNext = () => {
    // Validation
    if (currentStep === 0 && !selectedAddress) {
      alert('Veuillez sélectionner une adresse de livraison');
      return;
    }
    if (currentStep === 1 && !selectedDeliveryMethod) {
      alert('Veuillez sélectionner un mode de livraison');
      return;
    }
    if (currentStep === 2 && !selectedPaymentMethod) {
      alert('Veuillez sélectionner un moyen de paiement');
      return;
    }
    if (currentStep === 2 && selectedPaymentMethod?.id === 'card' && !isCardValid()) {
      alert('Veuillez remplir tous les champs de la carte bancaire');
      return;
    }

    // Mark current step as completed
    const updatedSteps = steps.map((step, index) =>
      index === currentStep ? { ...step, completed: true } : step
    );
    setSteps(updatedSteps);

    // Move to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const isCardValid = (): boolean => {
    if (!cardDetails) return false;
    return (
      cardDetails.cardNumber.replace(/\s/g, '').length === 16 &&
      cardDetails.expiry.length === 5 &&
      cardDetails.cvv.length >= 3 &&
      cardDetails.cardholderName.trim().length > 0
    );
  };

  const handleSubmitOrder = async () => {
    if (!cart || !selectedAddress || !selectedDeliveryMethod || !selectedPaymentMethod) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Integrate with order service API
      // const response = await createOrder({
      //   items: cart.items,
      //   deliveryAddress: selectedAddress,
      //   deliveryMethod: selectedDeliveryMethod.id,
      //   paymentMethod: selectedPaymentMethod.id,
      //   cardDetails: selectedPaymentMethod.id === 'card' ? cardDetails : undefined,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to confirmation page with order details
      navigate(`/checkout/confirmation?orderId=order_${Date.now()}`);
    } catch (error) {
      console.error('Order submission failed:', error);
      alert('Une erreur est survenue lors de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="checkout-loading">
        <div className="spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  if (!cart) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <CheckoutProgress currentStep={currentStep} steps={steps} />

        <div className="checkout-content">
          {/* Step 1: Address */}
          {currentStep === 0 && (
            <AddressForm
              addresses={addresses}
              selectedAddress={selectedAddress}
              onAddressSelect={setSelectedAddress}
              onAddNewAddress={handleAddNewAddress}
            />
          )}

          {/* Step 2: Delivery */}
          {currentStep === 1 && (
            <DeliveryOptions
              methods={MOCK_DELIVERY_METHODS}
              selectedMethod={selectedDeliveryMethod}
              onMethodSelect={setSelectedDeliveryMethod}
            />
          )}

          {/* Step 3: Payment */}
          {currentStep === 2 && (
            <PaymentMethod
              methods={MOCK_PAYMENT_METHODS}
              selectedMethod={selectedPaymentMethod}
              onMethodSelect={setSelectedPaymentMethod}
              onCardDetailsChange={setCardDetails}
            />
          )}

          {/* Step 4: Review */}
          {currentStep === 3 &&
            selectedAddress &&
            selectedDeliveryMethod &&
            selectedPaymentMethod && (
              <OrderReview
                cart={cart}
                deliveryAddress={selectedAddress}
                deliveryMethod={selectedDeliveryMethod}
                paymentMethod={selectedPaymentMethod}
                shippingCost={selectedDeliveryMethod.cost}
                onEdit={handleEditStep}
              />
            )}

          {/* Navigation Buttons */}
          <div className="checkout-actions">
            {currentStep > 0 && currentStep < 4 && (
              <button className="btn-secondary" onClick={handleBack} disabled={isSubmitting}>
                Retour
              </button>
            )}
            {currentStep < 3 && (
              <button className="btn-primary" onClick={handleNext}>
                Continuer
              </button>
            )}
            {currentStep === 3 && (
              <button
                className="btn-primary btn-submit"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                data-testid="btn-submit-order"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-small" />
                    <span>Traitement...</span>
                  </>
                ) : (
                  'Passer la commande'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Cart Summary Sidebar */}
        <div className="cart-summary-sidebar">
          <h3>Résumé du panier</h3>
          <div className="summary-items">
            {cart.items.slice(0, 3).map((item) => (
              <div key={item.id} className="summary-item">
                <span className="item-name">{item.name}</span>
                <span className="item-price">CHF {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            {cart.items.length > 3 && (
              <div className="more-items">+{cart.items.length - 3} autres articles</div>
            )}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>
              CHF {(cart.total + (selectedDeliveryMethod?.cost || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-page {
          min-height: calc(100vh - 100px);
          background-color: #f9fafb;
          padding: 2rem 1rem;
        }

        .checkout-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }

        .checkout-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .checkout-actions {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-primary:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }

        .btn-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .btn-secondary {
          background-color: white;
          color: #374151;
          border: 2px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #3b82f6;
        }

        .cart-summary-sidebar {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .cart-summary-sidebar h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #111827;
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .item-name {
          color: #374151;
        }

        .item-price {
          font-weight: 600;
          color: #111827;
        }

        .more-items {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: center;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
        }

        .checkout-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 200px);
          gap: 1rem;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1024px) {
          .checkout-container {
            grid-template-columns: 1fr;
          }

          .cart-summary-sidebar {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
