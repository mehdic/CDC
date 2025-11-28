/**
 * Proof of Delivery (POD) Types
 * Handles signature, photo, and recipient information for deliveries
 */

export enum ProofType {
  SIGNATURE = 'signature',
  PHOTO = 'photo',
  BOTH = 'both',
}

export interface SignatureData {
  base64: string;
  timestamp: string;
  capturedAt: string;
  mimeType: 'image/png';
}

export interface PhotoData {
  base64: string;
  timestamp: string;
  capturedAt: string;
  mimeType: 'image/jpeg';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface ProofOfDelivery {
  id: string;
  deliveryId: string;
  recipientName: string;
  signature?: SignatureData;
  photo?: PhotoData;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
  status: 'pending' | 'submitted' | 'verified';
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryCompletionPayload {
  deliveryId: string;
  recipientName: string;
  signature?: SignatureData;
  photo?: PhotoData;
  notes?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface UploadProofResponse {
  success: boolean;
  proofId: string;
  deliveryId: string;
  message: string;
}
