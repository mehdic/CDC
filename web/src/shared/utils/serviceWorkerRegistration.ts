/**
 * Service Worker Registration Utility
 *
 * Handles service worker registration, updates, and lifecycle events
 * for MetaPharm Connect PWA
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register service worker
 */
export async function register(config?: ServiceWorkerConfig): Promise<void> {
  if (process.env.NODE_ENV !== 'production' && !isLocalhost) {
    console.log('[SW] Service worker registration skipped (development mode)');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers not supported in this browser');
    return;
  }

  // Wait for page to load
  window.addEventListener('load', async () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    if (isLocalhost) {
      await checkValidServiceWorker(swUrl, config);
      console.log('[SW] Running on localhost - service worker may behave differently');
    } else {
      await registerValidSW(swUrl, config);
    }
  });
}

/**
 * Register valid service worker
 */
async function registerValidSW(
  swUrl: string,
  config?: ServiceWorkerConfig
): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);

    console.log('[SW] Service worker registered successfully:', registration.scope);

    // Handle updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;

      if (!installingWorker) {
        return;
      }

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('[SW] New content is available - please refresh');

            if (config?.onUpdate) {
              config.onUpdate(registration);
            }

            // Optionally show update notification
            showUpdateNotification(registration);
          } else {
            // Content is cached for offline use
            console.log('[SW] Content is cached for offline use');

            if (config?.onSuccess) {
              config.onSuccess(registration);
            }
          }
        }
      };
    };
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);

    if (config?.onError) {
      config.onError(error as Error);
    }
  }
}

/**
 * Check if service worker is valid (localhost only)
 */
async function checkValidServiceWorker(
  swUrl: string,
  config?: ServiceWorkerConfig
): Promise<void> {
  try {
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    });

    const contentType = response.headers.get('content-type');

    if (
      response.status === 404 ||
      (contentType && contentType.indexOf('javascript') === -1)
    ) {
      // Service worker not found or invalid content type
      console.warn('[SW] Service worker not found - unregistering');

      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      window.location.reload();
    } else {
      // Service worker found, proceed with registration
      await registerValidSW(swUrl, config);
    }
  } catch (error) {
    console.error('[SW] No internet connection - app running in offline mode');
  }
}

/**
 * Unregister service worker
 */
export async function unregister(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('[SW] Service worker unregistered successfully');
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
  }
}

/**
 * Update service worker immediately
 */
export async function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[SW] Service worker update check triggered');
  } catch (error) {
    console.error('[SW] Service worker update failed:', error);
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(registration: ServiceWorkerRegistration): void {
  // Create a custom event that the app can listen to
  const event = new CustomEvent('swUpdate', { detail: registration });
  window.dispatchEvent(event);

  // Optionally auto-update after 5 seconds
  const autoUpdate = localStorage.getItem('sw-auto-update') === 'true';

  if (autoUpdate) {
    setTimeout(() => {
      const installingWorker = registration.waiting;
      if (installingWorker) {
        installingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    }, 5000);
  }
}

/**
 * Skip waiting and activate new service worker immediately
 */
export function skipWaiting(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    const waiting = registration.waiting;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when the new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }
  });
}

/**
 * Clear all service worker caches
 */
export async function clearCaches(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const controller = registration.active;

    if (controller) {
      controller.postMessage({ type: 'CLEAR_CACHE' });
      console.log('[SW] Cache clear requested');
    }
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

/**
 * Check if service worker is ready
 */
export async function isServiceWorkerReady(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.active !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get current service worker registration
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!('serviceWorker' in navigator)) {
    return undefined;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('[SW] Failed to get registration:', error);
    return undefined;
  }
}

export default {
  register,
  unregister,
  updateServiceWorker,
  skipWaiting,
  clearCaches,
  isServiceWorkerReady,
  getRegistration,
};
