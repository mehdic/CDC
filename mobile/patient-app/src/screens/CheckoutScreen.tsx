/**
 * Checkout Screen
 * Checkout flow with address selection, payment method, and order placement
 * Task: T8-039 - Patient E-Commerce Cart and Checkout
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { selectCart } from '../store/cartSlice';
import * as cartService from '../services/cartService';

interface DeliveryAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'insurance' | 'cash';
  lastFourDigits?: string;
  cardBrand?: string;
  isDefault: boolean;
}

export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const cart = useSelector(selectCart);

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [useInsurance, setUseInsurance] = useState(false);
  const [insuranceCardNumber, setInsuranceCardNumber] = useState('');

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setLoading(true);

      const [addressesRes, paymentMethodsRes] = await Promise.all([
        cartService.getDeliveryAddresses(),
        cartService.getPaymentMethods(),
      ]);

      setAddresses(addressesRes.addresses);
      setPaymentMethods(paymentMethodsRes.methods);

      // Select default address and payment method
      const defaultAddress = addressesRes.addresses.find((a) => a.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }

      const defaultPayment = paymentMethodsRes.methods.find((m) => m.isDefault);
      if (defaultPayment) {
        setSelectedPaymentId(defaultPayment.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load checkout information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    // Validation
    if (!selectedAddressId) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (!selectedPaymentId) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (useInsurance && !insuranceCardNumber.trim()) {
      Alert.alert('Error', 'Please enter your insurance card number');
      return;
    }

    try {
      setPlacingOrder(true);

      const orderData: cartService.OrderRequest = {
        deliveryAddressId: selectedAddressId,
        paymentMethodId: selectedPaymentId,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        useInsurance,
        insuranceCardNumber: useInsurance ? insuranceCardNumber : undefined,
      };

      const response = await cartService.createOrder(orderData);

      if (response.success) {
        // Navigate to confirmation screen
        navigation.navigate('OrderConfirmation' as never, {
          orderId: response.order.id,
        } as never);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to place order';
      Alert.alert('Error', message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderAddressCard = (address: DeliveryAddress) => (
    <TouchableOpacity
      key={address.id}
      style={[
        styles.addressCard,
        selectedAddressId === address.id && styles.selectedCard,
      ]}
      onPress={() => setSelectedAddressId(address.id)}
    >
      <View style={styles.radioContainer}>
        <View
          style={[
            styles.radio,
            selectedAddressId === address.id && styles.radioSelected,
          ]}
        >
          {selectedAddressId === address.id && <View style={styles.radioDot} />}
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.addressName}>{address.name}</Text>
        <Text style={styles.addressDetails}>{address.street}</Text>
        <Text style={styles.addressDetails}>
          {address.city}, {address.postalCode}
        </Text>
        <Text style={styles.addressDetails}>{address.country}</Text>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPaymentCard = (method: PaymentMethod) => {
    let label = '';
    if (method.type === 'card') {
      label = `${method.cardBrand} •••• ${method.lastFourDigits}`;
    } else if (method.type === 'insurance') {
      label = 'Insurance Payment';
    } else if (method.type === 'cash') {
      label = 'Cash on Delivery';
    }

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentCard,
          selectedPaymentId === method.id && styles.selectedCard,
        ]}
        onPress={() => setSelectedPaymentId(method.id)}
      >
        <View style={styles.radioContainer}>
          <View
            style={[
              styles.radio,
              selectedPaymentId === method.id && styles.radioSelected,
            ]}
          >
            {selectedPaymentId === method.id && <View style={styles.radioDot} />}
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.paymentLabel}>{label}</Text>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading checkout...</Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No addresses saved</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>{addresses.map(renderAddressCard)}</View>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No payment methods saved</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>{paymentMethods.map(renderPaymentCard)}</View>
          )}
        </View>

        {/* Insurance Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setUseInsurance(!useInsurance)}
          >
            <View
              style={[
                styles.checkbox,
                useInsurance && styles.checkboxChecked,
              ]}
            >
              {useInsurance && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Use insurance coverage</Text>
          </TouchableOpacity>

          {useInsurance && (
            <TextInput
              style={styles.input}
              placeholder="Insurance card number"
              value={insuranceCardNumber}
              onChangeText={setInsuranceCardNumber}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g., Leave at the door, Ring the bell twice..."
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({cart.itemCount}):</Text>
              <Text style={styles.summaryValue}>${cart.subtotal.toFixed(2)}</Text>
            </View>

            {cart.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -${cart.discount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>${cart.tax.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${cart.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, placingOrder && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>
              Place Order - ${cart.total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  addressCard: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  radioContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#3B82F6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  cardContent: {
    flex: 1,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  addressDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptySectionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#111827',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  discountValue: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  placeOrderButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CheckoutScreen;
