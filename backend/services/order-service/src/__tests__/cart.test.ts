/**
 * Cart Service Tests
 * T3-037: Shopping Cart Tests
 */

import { DataSource } from 'typeorm';
import { Cart } from '../../../shared/models/Cart';
import { CartItem } from '../../../shared/models/CartItem';
import { User } from '../../../shared/models/User';
import { CartService } from '../services/cartService';
import { Product } from '../types/product';

describe('CartService', () => {
  let dataSource: DataSource;
  let cartService: CartService;

  const mockProduct: Product = {
    id: 'prod_001',
    name: 'Paracétamol 500mg',
    description: 'Pain reliever and fever reducer',
    category: 'OTC',
    price: 5.5,
    stock: 100,
    requiresPrescription: false,
    imageUrl: 'https://example.com/paracetamol.jpg',
  };

  const mockProduct2: Product = {
    id: 'prod_002',
    name: 'Crème hydratante SPF30',
    description: 'Moisturizing sunscreen',
    category: 'Parapharmacie',
    price: 12.0,
    stock: 50,
    requiresPrescription: false,
    imageUrl: 'https://example.com/creme.jpg',
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Cart, CartItem, User],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();
    cartService = new CartService(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('getOrCreateCart', () => {
    it('should create a new cart if one does not exist', async () => {
      const userId = 'user_001';

      const cart = await cartService.getOrCreateCart(userId);

      expect(cart).toBeDefined();
      expect(cart.userId).toBe(userId);
      expect(cart.items).toEqual([]);
      expect(cart.subtotal).toBe(0);
      expect(cart.total).toBe(0);
      expect(cart.status).toBe('active');
    });

    it('should return existing cart for user', async () => {
      const userId = 'user_002';

      const cart1 = await cartService.getOrCreateCart(userId);
      const cart2 = await cartService.getOrCreateCart(userId);

      expect(cart1.id).toBe(cart2.id);
    });
  });

  describe('addToCart', () => {
    it('should add a product to cart', async () => {
      const userId = 'user_003';

      const cart = await cartService.addToCart(userId, mockProduct.id, 2, mockProduct);

      expect(cart.items.length).toBe(1);
      expect(cart.items[0].productId).toBe(mockProduct.id);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].subtotal).toBe(11.0);
      expect(cart.itemCount).toBe(1);
      expect(cart.totalQuantity).toBe(2);
    });

    it('should increase quantity if product already in cart', async () => {
      const userId = 'user_004';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);
      const cart = await cartService.addToCart(userId, mockProduct.id, 2, mockProduct);

      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].subtotal).toBe(16.5);
      expect(cart.totalQuantity).toBe(3);
    });

    it('should throw error if quantity exceeds stock', async () => {
      const userId = 'user_005';

      const lowStockProduct = { ...mockProduct, stock: 2 };

      await expect(
        cartService.addToCart(userId, lowStockProduct.id, 5, lowStockProduct),
      ).rejects.toThrow('Only 2 items available');
    });

    it('should throw error if quantity is 0 or negative', async () => {
      const userId = 'user_006';

      await expect(cartService.addToCart(userId, mockProduct.id, 0, mockProduct)).rejects.toThrow(
        'Quantity must be greater than 0',
      );
    });
  });

  describe('removeFromCart', () => {
    it('should remove product from cart', async () => {
      const userId = 'user_007';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);
      const cart = await cartService.removeFromCart(userId, mockProduct.id);

      expect(cart.items.length).toBe(0);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal).toBe(0);
    });

    it('should not throw error if product not in cart', async () => {
      const userId = 'user_008';
      const cart = await cartService.getOrCreateCart(userId);
      await cartService.removeFromCart(userId, 'nonexistent_product');

      expect(cart.items.length).toBe(0);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update product quantity', async () => {
      const userId = 'user_009';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);
      const cart = await cartService.updateItemQuantity(userId, mockProduct.id, 5, 100);

      expect(cart.items[0].quantity).toBe(5);
      expect(cart.items[0].subtotal).toBe(27.5);
      expect(cart.totalQuantity).toBe(5);
    });

    it('should throw error if item not in cart', async () => {
      const userId = 'user_010';
      await cartService.getOrCreateCart(userId);

      await expect(
        cartService.updateItemQuantity(userId, 'nonexistent_product', 1, 100),
      ).rejects.toThrow('Item not found in cart');
    });

    it('should throw error if quantity exceeds stock', async () => {
      const userId = 'user_011';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);

      await expect(
        cartService.updateItemQuantity(userId, mockProduct.id, 150, 50),
      ).rejects.toThrow('Only 50 items available');
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const userId = 'user_012';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);
      await cartService.addToCart(userId, mockProduct2.id, 2, mockProduct2);

      const cart = await cartService.clearCart(userId);

      expect(cart.items.length).toBe(0);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount code to cart', async () => {
      const userId = 'user_013';

      await cartService.addToCart(userId, mockProduct.id, 2, mockProduct);
      const cart = await cartService.applyDiscount(userId, 'SAVE10', 1.1);

      expect(cart.discountCode).toBe('SAVE10');
      expect(cart.discount).toBe(1.1);
      expect(cart.total).toBeLessThan(cart.subtotal + cart.tax);
    });

    it('should throw error if discount exceeds subtotal', async () => {
      const userId = 'user_014';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);

      await expect(
        cartService.applyDiscount(userId, 'INVALID', 100),
      ).rejects.toThrow('Discount exceeds cart subtotal');
    });

    it('should throw error if discount is negative', async () => {
      const userId = 'user_015';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);

      await expect(
        cartService.applyDiscount(userId, 'INVALID', -5),
      ).rejects.toThrow('Discount cannot be negative');
    });
  });

  describe('removeDiscount', () => {
    it('should remove applied discount', async () => {
      const userId = 'user_016';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);
      await cartService.applyDiscount(userId, 'SAVE10', 1.0);
      const cart = await cartService.removeDiscount(userId);

      expect(cart.discountCode).toBeNull();
      expect(cart.discount).toBe(0);
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate 10% tax on subtotal minus discount', async () => {
      const userId = 'user_017';

      await cartService.addToCart(userId, mockProduct.id, 10, mockProduct); // Subtotal: 55
      const cartBefore = await cartService.getUserCart(userId);

      // Tax should be 5.5
      expect(cartBefore.tax).toBe(5.5);

      await cartService.applyDiscount(userId, 'SAVE10', 5.5); // Discount: 5.5
      const cartAfter = await cartService.getUserCart(userId);

      // Tax should be calculated on (55 - 5.5) = 49.5 * 0.1 = 4.95
      expect(cartAfter.tax).toBe(4.95);
      expect(cartAfter.total).toBe(49.5 + 4.95);
    });
  });

  describe('Multiple Items', () => {
    it('should handle multiple different products', async () => {
      const userId = 'user_018';

      await cartService.addToCart(userId, mockProduct.id, 2, mockProduct);
      const cart = await cartService.addToCart(userId, mockProduct2.id, 1, mockProduct2);

      expect(cart.items.length).toBe(2);
      expect(cart.itemCount).toBe(2);
      expect(cart.totalQuantity).toBe(3);
      expect(cart.subtotal).toBe(2 * 5.5 + 12.0);
    });
  });

  describe('markAsAbandoned', () => {
    it('should mark cart as abandoned', async () => {
      const userId = 'user_019';

      await cartService.addToCart(userId, mockProduct.id, 1, mockProduct);
      const cart = await cartService.markAsAbandoned(userId);

      expect(cart.status).toBe('abandoned');
      expect(cart.abandonedAt).toBeDefined();
    });
  });
});
