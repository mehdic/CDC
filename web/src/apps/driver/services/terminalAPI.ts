/**
 * Terminal API Client
 * Frontend service for terminal integration
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4013';

interface PairingRequestDTO {
  driver_id: string;
  serial_number: string;
  device_name: string;
}

interface PairingConfirmDTO {
  pairing_code: string;
  mac_address: string;
}

interface CardPaymentDTO {
  serial_number: string;
  cod_transaction_id: string;
  amount: number;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface PaymentProcessDTO {
  description?: string;
  skip_screen?: boolean;
}

class TerminalAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Pair terminal to driver
   */
  async pairTerminal(data: PairingRequestDTO): Promise<{ pairing_code: string; expires_at: string }> {
    try {
      const response = await this.client.post('/terminals/pair', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Confirm terminal pairing
   */
  async confirmPairing(
    serialNumber: string,
    data: PairingConfirmDTO
  ): Promise<{ terminal: any }> {
    try {
      const response = await this.client.post(
        `/terminals/${serialNumber}/confirm-pairing`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get terminal details
   */
  async getTerminal(serialNumber: string): Promise<any> {
    try {
      const response = await this.client.get(`/terminals/${serialNumber}`);
      return response.data.terminal;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update terminal status
   */
  async updateTerminalStatus(
    serialNumber: string,
    statusData: {
      battery_percentage: number;
      is_charging: boolean;
      is_connected: boolean;
      network_type?: string;
      signal_strength?: number;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/terminals/${serialNumber}/status`,
        statusData
      );
      return response.data.terminal;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get driver's terminals
   */
  async getDriverTerminals(driverId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/drivers/${driverId}/terminals`);
      return response.data.terminals;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Initiate card payment
   */
  async initiateCardPayment(
    deliveryId: string,
    data: CardPaymentDTO
  ): Promise<{ success: boolean; transaction: any }> {
    try {
      const response = await this.client.post(
        `/deliveries/${deliveryId}/card-payment`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Process payment on terminal
   */
  async processPayment(
    serialNumber: string,
    transactionId: string,
    data: PaymentProcessDTO
  ): Promise<{ success: boolean; transaction: any }> {
    try {
      const response = await this.client.post(
        `/terminals/${serialNumber}/transactions/${transactionId}/process`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(serialNumber: string, transactionId: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/terminals/${serialNumber}/transactions/${transactionId}`
      );
      return response.data.transaction;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    serialNumber: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/terminals/${serialNumber}/transactions`,
        {
          params: { limit },
        }
      );
      return response.data.transactions;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refund transaction
   */
  async refundTransaction(
    serialNumber: string,
    transactionId: string,
    reason: string
  ): Promise<{ success: boolean; transaction: any }> {
    try {
      const response = await this.client.post(
        `/terminals/${serialNumber}/transactions/${transactionId}/refund`,
        { reason }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Disable terminal
   */
  async disableTerminal(serialNumber: string): Promise<{ success: boolean; terminal: any }> {
    try {
      const response = await this.client.post(`/terminals/${serialNumber}/disable`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get daily terminal report
   */
  async getDailyTerminalReport(date?: Date): Promise<any> {
    try {
      const params: any = {};
      if (date) {
        params.date = date.toISOString().split('T')[0];
      }

      const response = await this.client.get('/reports/terminals/daily', { params });
      return response.data.report;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        return new Error(error.response.data.error);
      }
      if (error.response?.status === 404) {
        return new Error('Terminal or transaction not found');
      }
      if (error.response?.status === 401) {
        return new Error('Unauthorized - please log in again');
      }
      if (error.response?.status === 400) {
        return new Error('Invalid request - please check your input');
      }
      return new Error(error.message || 'API request failed');
    }

    return new Error(error instanceof Error ? error.message : 'Unknown error');
  }
}

// Export singleton instance
export const TerminalAPI = new TerminalAPIClient();
