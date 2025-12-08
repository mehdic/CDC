/**
 * User Behavior Event Types
 * Defines all trackable user events for behavior analytics
 */

export enum EventType {
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  PRODUCT_VIEW = 'PRODUCT_VIEW',
  PRODUCT_SEARCH = 'PRODUCT_SEARCH',
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  FEATURE_USED = 'FEATURE_USED',
  PAGE_VIEW = 'PAGE_VIEW'
}

/**
 * Base event interface
 */
export interface BaseEvent {
  eventType: EventType;
  userId: string;
  timestamp: Date;
  sessionId: string;
  metadata?: Record<string, any>;
}

/**
 * Session Events
 */
export interface SessionStartEvent extends BaseEvent {
  eventType: EventType.SESSION_START;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

export interface SessionEndEvent extends BaseEvent {
  eventType: EventType.SESSION_END;
  duration: number; // in seconds
}

/**
 * Product Events
 */
export interface ProductViewEvent extends BaseEvent {
  eventType: EventType.PRODUCT_VIEW;
  productId: string;
  productName: string;
  category: string;
  price?: number;
}

export interface ProductSearchEvent extends BaseEvent {
  eventType: EventType.PRODUCT_SEARCH;
  searchQuery: string;
  resultsCount: number;
  filters?: Record<string, any>;
}

/**
 * Order Events
 */
export interface OrderPlacedEvent extends BaseEvent {
  eventType: EventType.ORDER_PLACED;
  orderId: string;
  orderValue: number;
  itemCount: number;
  paymentMethod?: string;
}

export interface OrderCancelledEvent extends BaseEvent {
  eventType: EventType.ORDER_CANCELLED;
  orderId: string;
  reason?: string;
}

/**
 * Feature Usage Events
 */
export interface FeatureUsedEvent extends BaseEvent {
  eventType: EventType.FEATURE_USED;
  featureName: string;
  featureCategory: string;
  interactionType: 'click' | 'view' | 'complete';
}

/**
 * Page View Events
 */
export interface PageViewEvent extends BaseEvent {
  eventType: EventType.PAGE_VIEW;
  pageUrl: string;
  pageName: string;
  referrer?: string;
  timeOnPage?: number; // in seconds
}

/**
 * Union type for all events
 */
export type UserEvent =
  | SessionStartEvent
  | SessionEndEvent
  | ProductViewEvent
  | ProductSearchEvent
  | OrderPlacedEvent
  | OrderCancelledEvent
  | FeatureUsedEvent
  | PageViewEvent;

/**
 * Event validation helper
 */
export function isValidEvent(event: any): event is UserEvent {
  return (
    event &&
    typeof event === 'object' &&
    Object.values(EventType).includes(event.eventType) &&
    typeof event.userId === 'string' &&
    event.timestamp instanceof Date &&
    typeof event.sessionId === 'string'
  );
}

/**
 * Event factory - creates typed events
 */
export class EventFactory {
  static createSessionStart(
    userId: string,
    sessionId: string,
    deviceType: 'mobile' | 'tablet' | 'desktop',
    userAgent: string,
    metadata?: Record<string, any>
  ): SessionStartEvent {
    return {
      eventType: EventType.SESSION_START,
      userId,
      sessionId,
      timestamp: new Date(),
      deviceType,
      userAgent,
      metadata
    };
  }

  static createSessionEnd(
    userId: string,
    sessionId: string,
    duration: number,
    metadata?: Record<string, any>
  ): SessionEndEvent {
    return {
      eventType: EventType.SESSION_END,
      userId,
      sessionId,
      timestamp: new Date(),
      duration,
      metadata
    };
  }

  static createProductView(
    userId: string,
    sessionId: string,
    productId: string,
    productName: string,
    category: string,
    price?: number,
    metadata?: Record<string, any>
  ): ProductViewEvent {
    return {
      eventType: EventType.PRODUCT_VIEW,
      userId,
      sessionId,
      timestamp: new Date(),
      productId,
      productName,
      category,
      price,
      metadata
    };
  }

  static createProductSearch(
    userId: string,
    sessionId: string,
    searchQuery: string,
    resultsCount: number,
    filters?: Record<string, any>,
    metadata?: Record<string, any>
  ): ProductSearchEvent {
    return {
      eventType: EventType.PRODUCT_SEARCH,
      userId,
      sessionId,
      timestamp: new Date(),
      searchQuery,
      resultsCount,
      filters,
      metadata
    };
  }

  static createOrderPlaced(
    userId: string,
    sessionId: string,
    orderId: string,
    orderValue: number,
    itemCount: number,
    paymentMethod?: string,
    metadata?: Record<string, any>
  ): OrderPlacedEvent {
    return {
      eventType: EventType.ORDER_PLACED,
      userId,
      sessionId,
      timestamp: new Date(),
      orderId,
      orderValue,
      itemCount,
      paymentMethod,
      metadata
    };
  }

  static createOrderCancelled(
    userId: string,
    sessionId: string,
    orderId: string,
    reason?: string,
    metadata?: Record<string, any>
  ): OrderCancelledEvent {
    return {
      eventType: EventType.ORDER_CANCELLED,
      userId,
      sessionId,
      timestamp: new Date(),
      orderId,
      reason,
      metadata
    };
  }

  static createFeatureUsed(
    userId: string,
    sessionId: string,
    featureName: string,
    featureCategory: string,
    interactionType: 'click' | 'view' | 'complete',
    metadata?: Record<string, any>
  ): FeatureUsedEvent {
    return {
      eventType: EventType.FEATURE_USED,
      userId,
      sessionId,
      timestamp: new Date(),
      featureName,
      featureCategory,
      interactionType,
      metadata
    };
  }

  static createPageView(
    userId: string,
    sessionId: string,
    pageUrl: string,
    pageName: string,
    referrer?: string,
    timeOnPage?: number,
    metadata?: Record<string, any>
  ): PageViewEvent {
    return {
      eventType: EventType.PAGE_VIEW,
      userId,
      sessionId,
      timestamp: new Date(),
      pageUrl,
      pageName,
      referrer,
      timeOnPage,
      metadata
    };
  }
}
