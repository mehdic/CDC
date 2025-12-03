/**
 * SumUp Terminal API Client
 * Integration with SumUp mobile payment terminals
 * Handles card present and contactless payments
 */

import axios, { AxiosInstance } from 'axios';
import { TerminalPaymentType, TerminalCardScheme } from '../../../../../shared/models/TerminalTransaction';

export interface SumUpDeviceInfo {
  id: string;
  serial_number: string;
  name: string;
  model: string;
  status: string;
  currency: string;
  battery_level?: number;
  network_type?: string;
}

export interface SumUpPairingRequest {
  serial_number: string;
  device_name: string;
}

export interface SumUpPairingResponse {
  id: string;
  pairing_code: string;
  expires_at: string;
}

export interface SumUpPaymentRequest {
  amount: number; // in cents
  currency: string; // CHF
  description: string;
  reference_id?: string;
  customer_reference?: string;
  skip_screen?: boolean;
  tip_amount?: number;
}

export interface SumUpPaymentResponse {
  id: string;
  status: string;
  amount: number;
  amount_charged?: number;
  currency: string;
  card: {
    type: string;
    name: string;
    last4: string;
    scheme: string;
  };
  timestamp: string;
  auth_code?: string;
  rrn?: string;
  receipt_id?: string;
  receipt_url?: string;
}

export interface SumUpTerminalStatus {
  id: string;
  status: string;
  battery_level: number;
  network_type: string;
  signal_strength: number;
  is_online: boolean;
  last_heartbeat: string;
}

export interface SumUpRefundRequest {
  transaction_id: string;
  amount?: number;
  reason: string;
}

export interface SumUpRefundResponse {
  id: string;
  original_transaction_id: string;
  amount: number;
  status: string;
  timestamp: string;
}

export class SumUpClient {
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly merchantId: string;

  constructor(apiKey: string, merchantId: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.merchantId = merchantId;
    this.baseUrl = baseUrl || 'https://api.sumup.com';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MetaPharmConnect/1.0.0',
      },
      timeout: 10000,
    });
  }

  /**
   * Get list of paired devices for merchant
   */
  async listDevices(): Promise<SumUpDeviceInfo[]> {
    try {
      const response = await this.client.get(`/v0.1/merchants/${this.merchantId}/devices`);
      return response.data.items || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to list devices');
    }
  }

  /**
   * Get device info by serial number
   */
  async getDeviceInfo(serialNumber: string): Promise<SumUpDeviceInfo> {
    try {
      const response = await this.client.get(
        `/v0.1/merchants/${this.merchantId}/devices/${serialNumber}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get device info');
    }
  }

  /**
   * Initiate device pairing
   */
  async initiateDevicePairing(serialNumber: string, deviceName: string): Promise<SumUpPairingResponse> {
    try {
      const response = await this.client.post(
        `/v0.1/merchants/${this.merchantId}/devices/${serialNumber}/pair`,
        {
          device_name: deviceName,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to initiate device pairing');
    }
  }

  /**
   * Confirm device pairing with code
   */
  async confirmDevicePairing(serialNumber: string, pairingCode: string): Promise<SumUpDeviceInfo> {
    try {
      const response = await this.client.post(
        `/v0.1/merchants/${this.merchantId}/devices/${serialNumber}/confirm-pair`,
        {
          pairing_code: pairingCode,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to confirm device pairing');
    }
  }

  /**
   * Get terminal status and battery level
   */
  async getTerminalStatus(serialNumber: string): Promise<SumUpTerminalStatus> {
    try {
      const response = await this.client.get(
        `/v0.1/merchants/${this.merchantId}/devices/${serialNumber}/status`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get terminal status');
    }
  }

  /**
   * Process payment transaction
   */
  async processPayment(
    serialNumber: string,
    paymentRequest: SumUpPaymentRequest
  ): Promise<SumUpPaymentResponse> {
    try {
      const response = await this.client.post(
        `/v0.1/merchants/${this.merchantId}/devices/${serialNumber}/transactions`,
        {
          amount_in_cents: paymentRequest.amount,
          currency: paymentRequest.currency,
          description: paymentRequest.description,
          reference_id: paymentRequest.reference_id,
          customer_reference: paymentRequest.customer_reference,
          skip_screen: paymentRequest.skip_screen || false,
          tip_amount_in_cents: paymentRequest.tip_amount,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to process payment');
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string): Promise<SumUpPaymentResponse> {
    try {
      const response = await this.client.get(`/v0.1/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get transaction details');
    }
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<SumUpRefundResponse> {
    try {
      const response = await this.client.post(`/v0.1/transactions/${transactionId}/refunds`, {
        amount_in_cents: amount,
        reason: reason || 'Customer requested',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to refund transaction');
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    serialNumber: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: SumUpPaymentResponse[]; total: number }> {
    try {
      const response = await this.client.get(
        `/v0.1/merchants/${this.merchantId}/devices/${serialNumber}/transactions`,
        {
          params: {
            limit,
            offset,
          },
        }
      );
      return {
        transactions: response.data.items || [],
        total: response.data.total || 0,
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get transaction history');
    }
  }

  /**
   * Send receipt via email
   */
  async sendReceiptEmail(transactionId: string, email: string): Promise<{ success: boolean }> {
    try {
      const response = await this.client.post(`/v0.1/transactions/${transactionId}/send-receipt`, {
        email,
      });
      return { success: response.status === 200 };
    } catch (error) {
      throw this.handleError(error, 'Failed to send receipt email');
    }
  }

  /**
   * Disable device
   */
  async disableDevice(serialNumber: string): Promise<{ success: boolean }> {
    try {
      const response = await this.client.post(
        `/v0.1/merchants/${this.merchantId}/devices/${serialNumber}/disable`
      );
      return { success: response.status === 200 };
    } catch (error) {
      throw this.handleError(error, 'Failed to disable device');
    }
  }

  /**
   * Parse card scheme from SumUp response
   */
  parseCardScheme(sumupScheme: string): TerminalCardScheme {
    const schemeMap: Record<string, TerminalCardScheme> = {
      'VISA': TerminalCardScheme.VISA,
      'MASTERCARD': TerminalCardScheme.MASTERCARD,
      'AMEX': TerminalCardScheme.AMEX,
      'AMERICAN EXPRESS': TerminalCardScheme.AMEX,
      'DINERS': TerminalCardScheme.DINERS,
      'DINERS CLUB': TerminalCardScheme.DINERS,
    };
    return schemeMap[sumupScheme.toUpperCase()] || TerminalCardScheme.UNKNOWN;
  }

  /**
   * Parse payment type from SumUp response
   */
  parsePaymentType(sumupPaymentType: string): TerminalPaymentType {
    const typeMap: Record<string, TerminalPaymentType> = {
      'CARD_PRESENT': TerminalPaymentType.CARD_PRESENT,
      'CONTACTLESS': TerminalPaymentType.CONTACTLESS,
      'NFC': TerminalPaymentType.CONTACTLESS,
      'MOBILE_WALLET': TerminalPaymentType.MOBILE_WALLET,
      'APPLE_PAY': TerminalPaymentType.MOBILE_WALLET,
      'GOOGLE_PAY': TerminalPaymentType.MOBILE_WALLET,
    };
    return typeMap[sumupPaymentType.toUpperCase()] || TerminalPaymentType.CARD_PRESENT;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any, message: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      // Handle specific SumUp error codes
      if (status === 401) {
        throw new Error(`${message}: Unauthorized - Invalid API key`);
      } else if (status === 404) {
        throw new Error(`${message}: Device or transaction not found`);
      } else if (status === 400) {
        const errorMessage = data?.error?.message || 'Invalid request';
        throw new Error(`${message}: ${errorMessage}`);
      } else if (status === 409) {
        throw new Error(`${message}: Device already paired`);
      } else if (status === 429) {
        throw new Error(`${message}: Rate limit exceeded - please try again later`);
      } else if (status && status >= 500) {
        throw new Error(`${message}: SumUp service unavailable (${status})`);
      } else {
        throw new Error(`${message}: ${error.message}`);
      }
    }

    throw new Error(`${message}: ${error.message || error}`);
  }
}
