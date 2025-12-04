/**
 * Cart Service
 * Handles shopping cart operations (add, remove, update items)
 * T3-036: Cart Business Logic
 */

import { DataSource, Repository } from 'typeorm';
import { Cart } from '../../../../shared/models/Cart';
import { CartItem } from '../../../../shared/models/CartItem';
import { Product } from '../types/product';

const TAX_RATE = 0.1; // 10% tax

export class CartService {
  private cartRepository: Repository<Cart>;
  private cartItemRepository: Repository<CartItem>;

  constructor(dataSource: DataSource) {
    this.cartRepository = dataSource.getRepository(Cart);
    this.cartItemRepository = dataSource.getRepository(CartItem);
  }

  /**
   * Get or create cart for user
   */
  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        totalQuantity: 0,
        status: 'active',
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  /**
   * Get cart by ID
   */
  async getCart(cartId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
  }

  /**
   * Get user's active cart
   */
  async getUserCart(userId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['items'],
    });
  }

  /**
   * Add item to cart
   */
  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    product: Product,
  ): Promise<Cart> {
    // Validate quantity
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (quantity > product.stock) {
      throw new Error(`Only ${product.stock} items available`);
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    let cartItem = cart.items.find((item) => item.productId === productId);

    if (cartItem) {
      // Update quantity
      const newQuantity = cartItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new Error(`Only ${product.stock} items available`);
      }
      cartItem.quantity = newQuantity;
    } else {
      // Create new cart item
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        quantity,
        subtotal: product.price * quantity,
        requiresPrescription: product.requiresPrescription,
        imageUrl: product.imageUrl,
        availableStock: product.stock,
        options: product.options || {},
      });
      cart.items.push(cartItem);
    }

    // Recalculate cart totals
    this.recalculateCartTotals(cart);

    // Save cart
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    // Remove item
    cart.items = cart.items.filter((item) => item.productId !== productId);

    // Recalculate totals
    this.recalculateCartTotals(cart);

    // Save cart
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
    availableStock: number,
  ): Promise<Cart> {
    // Validate quantity
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (quantity > availableStock) {
      throw new Error(`Only ${availableStock} items available`);
    }

    const cart = await this.getOrCreateCart(userId);

    // Find item
    const cartItem = cart.items.find((item) => item.productId === productId);
    if (!cartItem) {
      throw new Error('Item not found in cart');
    }

    // Update quantity and subtotal
    cartItem.quantity = quantity;
    cartItem.subtotal = cartItem.price * quantity;

    // Recalculate cart totals
    this.recalculateCartTotals(cart);

    // Save cart
    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    cart.items = [];
    this.recalculateCartTotals(cart);

    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Apply discount code
   */
  async applyDiscount(
    userId: string,
    discountCode: string,
    discountAmount: number,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    // Validate discount
    if (discountAmount < 0) {
      throw new Error('Discount cannot be negative');
    }

    if (discountAmount > cart.subtotal) {
      throw new Error('Discount exceeds cart subtotal');
    }

    cart.discountCode = discountCode;
    cart.discount = discountAmount;

    // Recalculate totals
    this.recalculateCartTotals(cart);

    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Remove discount code
   */
  async removeDiscount(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    cart.discountCode = null;
    cart.discount = 0;

    // Recalculate totals
    this.recalculateCartTotals(cart);

    await this.cartRepository.save(cart);

    return cart;
  }

  /**
   * Recalculate cart totals
   */
  private recalculateCartTotals(cart: Cart): void {
    // Calculate subtotal and item counts
    let subtotal = 0;
    let itemCount = 0;
    let totalQuantity = 0;

    cart.items.forEach((item) => {
      subtotal += item.subtotal;
      itemCount += 1;
      totalQuantity += item.quantity;
    });

    cart.subtotal = Math.round(subtotal * 100) / 100;
    cart.itemCount = itemCount;
    cart.totalQuantity = totalQuantity;

    // Calculate tax (after discount)
    const taxableAmount = Math.max(0, cart.subtotal - cart.discount);
    cart.tax = Math.round(taxableAmount * TAX_RATE * 100) / 100;

    // Calculate total
    cart.total = Math.round((cart.subtotal + cart.tax - cart.discount) * 100) / 100;
  }

  /**
   * Validate all items are in stock
   */
  async validateItemsInStock(
    cart: Cart,
    productStockMap: Map<string, number>,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    cart.items.forEach((item) => {
      const stock = productStockMap.get(item.productId);
      if (stock === undefined) {
        errors.push(`Product ${item.productId} no longer available`);
      } else if (item.quantity > stock) {
        errors.push(`Only ${stock} of ${item.name} available, but ${item.quantity} in cart`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert cart to order
   */
  async convertToOrder(userId: string): Promise<any> {
    const cart = await this.getOrCreateCart(userId);

    if (cart.items.length === 0) {
      throw new Error('Cannot create order from empty cart');
    }

    // Create order object (to be used by order service)
    const order = {
      userId,
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      discount: cart.discount,
      total: cart.total,
      discountCode: cart.discountCode,
      status: 'pending',
      createdAt: new Date(),
    };

    // Mark cart as completed
    cart.status = 'completed';
    await this.cartRepository.save(cart);

    return order;
  }

  /**
   * Mark cart as abandoned
   */
  async markAsAbandoned(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    cart.status = 'abandoned';
    cart.abandonedAt = new Date();
    await this.cartRepository.save(cart);
    return cart;
  }
}
