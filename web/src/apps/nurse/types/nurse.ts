/**
 * Nurse App Type Definitions
 * Defines interfaces for patients, medication orders, and notifications
 */

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  room: string;
  ward: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: Medication[];
  contactNumber: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  nurseNotes: string[];
  lastUpdated: string;
}

export interface Medication {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  instructions: string;
}

export interface MedicationOrder {
  id: string;
  patientId: string;
  patientName: string;
  room: string;
  medications: OrderMedication[];
  urgency: 'routine' | 'urgent' | 'stat';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';
  pharmacyId: string;
  pharmacyName: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  deliveryId?: string;
}

export interface OrderMedication {
  drugName: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

export interface DeliveryStatus {
  orderId: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered';
  driverId?: string;
  driverName?: string;
  estimatedArrival?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: string;
}

export interface Notification {
  id: string;
  type: 'order_confirmed' | 'order_ready' | 'delivery_assigned' | 'delivery_arriving' | 'delivery_complete';
  title: string;
  message: string;
  orderId?: string;
  patientId?: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface DashboardStats {
  totalPatients: number;
  pendingOrders: number;
  activeOrders?: number;
  inTransitDeliveries: number;
  pendingDeliveries?: number;
  todayDeliveries: number;
  urgentOrders: number;
  unreadMessages?: number;
  newAlerts?: number;
}

export interface OrderHistory {
  orderId: string;
  patientName: string;
  date: string;
  status: string;
  medications: string[];
  totalItems: number;
}

export interface PatientSummary {
  id: string;
  name: string;
  room: string;
  ward: string;
  urgentOrders: number;
  pendingOrders: number;
  lastOrderDate?: string;
}
