/**
 * Cart Routes
 * Shopping cart management endpoints
 * T3-034: Cart API Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cartService';

const router = Router();

/**
 * Middleware to get CartService from app locals
 */
const getCartService = (req: Request): CartService => {
  const dataSource = req.app.locals.dataSource;
  if (!dataSource) {
    throw new Error('Database connection not available');
  }
  return new CartService(dataSource);
};

/**
 * GET /cart
 * Get user's active shopping cart
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in request',
        code: 'MISSING_USER_ID',
      });
    }

    const cartService = getCartService(req);
    const cart = await cartService.getOrCreateCart(userId);

    return res.json({
      success: true,
      cart: {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          imageUrl: item.imageUrl,
          requiresPrescription: item.requiresPrescription,
        })),
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount,
        discountCode: cart.discountCode,
        total: cart.total,
        itemCount: cart.itemCount,
        totalQuantity: cart.totalQuantity,
        status: cart.status,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /cart/add
 * Add product to cart
 *
 * Body:
 * - productId: string (required)
 * - quantity: number (required, default: 1)
 * - product: Product object (required, for validation)
 */
router.post('/add', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in request',
        code: 'MISSING_USER_ID',
      });
    }

    const { productId, quantity = 1, product } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'productId is required',
        code: 'MISSING_PRODUCT_ID',
      });
    }

    if (!product) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'product object is required',
        code: 'MISSING_PRODUCT',
      });
    }

    const cartService = getCartService(req);
    const cart = await cartService.addToCart(userId, productId, quantity, product);

    return res.json({
      success: true,
      message: `Product added to cart`,
      cart: {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount,
        total: cart.total,
        itemCount: cart.itemCount,
      },
    });
  } catch (error: any) {
    if (error.message.includes('available') || error.message.includes('Quantity')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: 'INVALID_QUANTITY',
      });
    }
    next(error);
  }
});

/**
 * PUT /cart/items/:productId/quantity
 * Update item quantity in cart
 *
 * Body:
 * - quantity: number (required)
 * - availableStock: number (required)
 */
router.put('/items/:productId/quantity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in request',
        code: 'MISSING_USER_ID',
      });
    }

    const { productId } = req.params;
    const { quantity, availableStock } = req.body;

    // Validate input
    if (!quantity || typeof quantity !== 'number') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'quantity is required and must be a number',
        code: 'INVALID_QUANTITY',
      });
    }

    if (!availableStock) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'availableStock is required',
        code: 'MISSING_STOCK',
      });
    }

    const cartService = getCartService(req);
    const cart = await cartService.updateItemQuantity(
      userId,
      productId,
      quantity,
      availableStock,
    );

    return res.json({
      success: true,
      message: `Item quantity updated`,
      cart: {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount,
        total: cart.total,
        itemCount: cart.itemCount,
      },
    });
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('available')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: 'INVALID_REQUEST',
      });
    }
    next(error);
  }
});

/**
 * DELETE /cart/items/:productId
 * Remove item from cart
 */
router.delete('/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in request',
        code: 'MISSING_USER_ID',
      });
    }

    const { productId } = req.params;

    const cartService = getCartService(req);
    const cart = await cartService.removeFromCart(userId, productId);

    return res.json({
      success: true,
      message: `Item removed from cart`,
      cart: {
        id: cart.id,
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount,
        total: cart.total,
        itemCount: cart.itemCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /cart/apply-discount
 * Apply discount code to cart
 *
 * Body:
 * - discountCode: string (required)
 * - discountAmount: number (required)
 */
router.post('/apply-discount', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in request',
        code: 'MISSING_USER_ID',
      });
    }

    const { discountCode, discountAmount } = req.body;

    // Validate input
    if (!discountCode) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'discountCode is required',
        code: 'MISSING_DISCOUNT_CODE',
      });
    }

    if (typeof discountAmount !== 'number') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'discountAmount is required and must be a number',
        code: 'INVALID_DISCOUNT',
      });
    }

    const cartService = getCartService(req);
    const cart = await cartService.applyDiscount(userId, discountCode, discountAmount);

    return res.json({
      success: true,
      message: `Discount code applied`,
      cart: {
        id: cart.id,
        subtotal: cart.subtotal,
        tax: cart.tax,
        discount: cart.discount,
        discountCode: cart.discountCode,
        total: cart.total,
        itemCount: cart.itemCount,
      },
    });
  } catch (error: any) {
    if (error.message.includes('exceeds') || error.message.includes('Discount')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        code: 'INVALID_DISCOUNT',
      });
    }
    next(error);
  }
});

/**
 * DELETE /cart/clear
 * Clear all items from cart
 */
router.delete('/clear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in request',
        code: 'MISSING_USER_ID',
      });
    }

    const cartService = getCartService(req);
    const cart = await cartService.clearCart(userId);

    return res.json({
      success: true,
      message: 'Cart cleared',
      cart: {
        id: cart.id,
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
