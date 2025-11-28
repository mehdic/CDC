/**
 * Order Confirmation Page Wrapper
 * T3-041: Order Confirmation Flow
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ConfirmationPage, OrderConfirmationData } from '@shared/components/checkout';

export const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      navigate('/ecommerce');
      return;
    }

    // TODO: Fetch actual order data from API
    // For now, using mock data
    const fetchOrderData = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock order data
        const mockOrder: OrderConfirmationData = {
          orderId,
          orderNumber: orderId.replace('order_', 'ORD-'),
          total: 32.3,
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryAddress: {
            street: '123 Rue de la Paix',
            city: 'Geneva',
            postalCode: '1200',
            country: 'Switzerland',
          },
          items: [
            {
              id: 'item_001',
              name: 'Paracétamol 500mg',
              quantity: 2,
              price: 5.5,
            },
            {
              id: 'item_002',
              name: 'Crème hydratante SPF30',
              quantity: 1,
              price: 12.0,
            },
          ],
        };

        setOrderData(mockOrder);
      } catch (error) {
        console.error('Failed to fetch order data:', error);
        navigate('/ecommerce');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [searchParams, navigate]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Chargement de la confirmation...</p>

        <style jsx>{`
          .loading-container {
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

          p {
            color: #6b7280;
          }
        `}</style>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  return <ConfirmationPage order={orderData} />;
};

export default OrderConfirmation;
