/**
 * Product Type Definition
 * Represents a product from the inventory service
 */

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
  imageUrl?: string;
  options?: Record<string, any>;
}
