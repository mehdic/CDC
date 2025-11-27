/**
 * Caching Layer Interface for FDB API
 * Provides abstraction for different cache implementations
 * Designed to support both in-memory (development) and Redis (production)
 * T3-005: Cache layer implementation
 */

export interface CacheProvider {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds (optional)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Delete value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Clear entire cache
   */
  clear(): Promise<void>;

  /**
   * Check if key exists in cache
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): Promise<boolean>;
}

/**
 * In-Memory Cache Implementation
 * Simple cache for development/testing
 * NOT suitable for production with multiple server instances
 */
export class InMemoryCache implements CacheProvider {
  private cache: Map<string, { value: any; expiresAt: number | null }>;

  constructor() {
    this.cache = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getStats() {
    let active = 0;
    let expired = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      totalKeys: this.cache.size,
      activeKeys: active,
      expiredKeys: expired,
    };
  }
}

/**
 * Redis Cache Implementation (placeholder)
 * Ready for production Redis integration
 *
 * To use in production:
 * 1. Install redis: npm install redis
 * 2. Configure REDIS_URL environment variable
 * 3. Instantiate with Redis client
 */
export class RedisCache implements CacheProvider {
  private client: any; // Redis client type
  private connected: boolean;

  constructor(redisClient?: any) {
    this.client = redisClient;
    this.connected = !!redisClient;

    if (!this.connected) {
      console.warn(
        '[Redis Cache] Redis client not provided. This is a placeholder. ' +
        'Install and configure Redis for production use.'
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected) {
      console.warn('[Redis Cache] Not connected - returning null');
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (!value) {
        return null;
      }

      // Parse JSON
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[Redis Cache] Get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.connected) {
      console.warn('[Redis Cache] Not connected - skipping set');
      return;
    }

    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('[Redis Cache] Set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('[Redis Cache] Delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('[Redis Cache] Clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('[Redis Cache] Has error:', error);
      return false;
    }
  }
}

/**
 * Cache Factory
 * Creates appropriate cache provider based on configuration
 */
export class CacheFactory {
  /**
   * Create cache provider based on environment
   * @param redisClient Optional Redis client for production
   * @returns CacheProvider instance
   */
  static createCache(redisClient?: any): CacheProvider {
    // Use Redis if client provided and in production
    if (redisClient && process.env.NODE_ENV === 'production') {
      console.info('[Cache Factory] Using Redis cache');
      return new RedisCache(redisClient);
    }

    // Default to in-memory cache
    console.info('[Cache Factory] Using in-memory cache (not recommended for production)');
    return new InMemoryCache();
  }
}
