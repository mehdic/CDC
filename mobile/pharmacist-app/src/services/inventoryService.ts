/**
 * Inventory API Client
 * HTTP client for Inventory Service API
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const INVENTORY_SERVICE_URL = `${API_BASE_URL}/inventory`;

export interface ScanRequest {
  qr_code: string;
  transaction_type: 'receive' | 'dispense' | 'transfer' | 'return' | 'adjustment' | 'expired';
  quantity: number;
  pharmacy_id: string;
  user_id: string;
  prescription_id?: string;
  notes?: string;
  batch_number?: string;
  supplier_name?: string;
  cost_per_unit?: number;
}

export interface InventoryItem {
  id: string;
  medication_name: string;
  medication_gtin: string;
  quantity: number;
  unit: string;
  reorder_threshold: number | null;
  optimal_stock_level: number | null;
  batch_number: string | null;
  expiry_date: string | null;
  is_controlled: boolean;
  storage_location: string | null;
}

export interface InventoryAlert {
  id: string;
  alert_type: 'low_stock' | 'expiring_soon' | 'expired' | 'reorder_suggested';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ai_suggested_action: string | null;
  ai_suggested_quantity: number | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  created_at: string;
  inventory_item: InventoryItem;
}

export interface InventoryAnalytics {
  overview: {
    total_items: number;
    total_inventory_value: string;
    low_stock_items: number;
    out_of_stock_items: number;
    expiring_soon_items: number;
    expired_items: number;
    controlled_substances: number;
    turnover_rate_percent: string;
  };
  alerts: {
    by_severity: Array<{ severity: string; count: string }>;
  };
  recent_activity: {
    transactions_last_7_days: Array<{ type: string; count: string; total_quantity: string }>;
    top_dispensed_items_last_30_days: Array<{ medication_name: string; total_dispensed: string }>;
  };
  generated_at: string;
}

class InventoryService {
  /**
   * Scan QR code and update inventory
   */
  async scanQRCode(request: ScanRequest) {
    const response = await axios.post(`${INVENTORY_SERVICE_URL}/scan`, request);
    return response.data;
  }

  /**
   * Get inventory items with filtering
   */
  async getItems(params: {
    pharmacy_id: string;
    medication_name?: string;
    low_stock?: boolean;
    expiring_soon?: boolean;
    expired?: boolean;
    is_controlled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: InventoryItem[]; pagination: any }> {
    const response = await axios.get(`${INVENTORY_SERVICE_URL}/items`, { params });
    return response.data;
  }

  /**
   * Get single inventory item by ID
   */
  async getItemById(id: string, pharmacy_id: string): Promise<{ item: InventoryItem }> {
    const response = await axios.get(`${INVENTORY_SERVICE_URL}/items/${id}`, {
      params: { pharmacy_id },
    });
    return response.data;
  }

  /**
   * Update inventory item (manual adjustments)
   */
  async updateItem(id: string, data: Partial<InventoryItem> & { pharmacy_id: string }) {
    const response = await axios.put(`${INVENTORY_SERVICE_URL}/items/${id}`, data);
    return response.data;
  }

  /**
   * Get active alerts
   */
  async getAlerts(params: {
    pharmacy_id: string;
    alert_type?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: InventoryAlert[]; pagination: any }> {
    const response = await axios.get(`${INVENTORY_SERVICE_URL}/alerts`, { params });
    return response.data;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(id: string, pharmacy_id: string, user_id: string) {
    const response = await axios.put(`${INVENTORY_SERVICE_URL}/alerts/${id}/acknowledge`, {
      pharmacy_id,
      user_id,
    });
    return response.data;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(id: string, pharmacy_id: string) {
    const response = await axios.put(`${INVENTORY_SERVICE_URL}/alerts/${id}/resolve`, {
      pharmacy_id,
    });
    return response.data;
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(id: string, pharmacy_id: string) {
    const response = await axios.put(`${INVENTORY_SERVICE_URL}/alerts/${id}/dismiss`, {
      pharmacy_id,
    });
    return response.data;
  }

  /**
   * Get inventory analytics
   */
  async getAnalytics(pharmacy_id: string): Promise<InventoryAnalytics> {
    const response = await axios.get(`${INVENTORY_SERVICE_URL}/analytics`, {
      params: { pharmacy_id },
    });
    return response.data;
  }
}

export default new InventoryService();
