// Service Worker Registration
// This file handles the registration and updates of the service worker

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = `/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log("[SW] Service Worker registered:", registration);

          // Check for updates periodically (every 60 seconds)
          setInterval(() => {
            registration.update();
          }, 60000);

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            console.log("[SW] New service worker found");

            newWorker?.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                console.log("[SW] New content available, please refresh");

                // Show update notification
                if (confirm("New version available! Reload to update?")) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error("[SW] Service Worker registration failed:", error);
        });

      // Handle controller change
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  } else {
    console.log("[SW] Service workers are not supported");
  }
}

export function unregisterServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error("[SW] Error unregistering service worker:", error);
      });
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("[Notifications] Not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Check if app is installed
export function isInstalled() {
  // Check if running in standalone mode
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// Background sync for course progress
export async function syncCourseProgress(
  courseId: string,
  data: any,
  token: string,
) {
  if (
    !("serviceWorker" in navigator) ||
    !("sync" in ServiceWorkerRegistration.prototype)
  ) {
    console.log("[Sync] Background sync not supported");
    return false;
  }

  try {
    // Store update in localStorage for service worker to pick up
    const pendingUpdates = JSON.parse(
      localStorage.getItem("pendingUpdates") || "[]",
    );
    pendingUpdates.push({
      id: Date.now().toString(),
      courseId,
      data,
      token,
      timestamp: Date.now(),
    });
    localStorage.setItem("pendingUpdates", JSON.stringify(pendingUpdates));

    // Register sync
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register("sync-course-progress");
    console.log("[Sync] Course progress sync registered");
    return true;
  } catch (error) {
    console.error("[Sync] Failed to register sync:", error);
    return false;
  }
}

// Show offline indicator
export function createOfflineIndicator() {
  if (typeof window === "undefined") return null;

  const indicator = document.createElement("div");
  indicator.id = "offline-indicator";
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f59e0b;
    color: white;
    padding: 8px;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    z-index: 99999;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  `;
  indicator.textContent = "You're offline. Changes will sync when reconnected.";

  document.body.appendChild(indicator);

  const updateIndicator = () => {
    indicator.style.display = navigator.onLine ? "none" : "block";
  };

  window.addEventListener("online", updateIndicator);
  window.addEventListener("offline", updateIndicator);
  updateIndicator();

  return () => {
    window.removeEventListener("online", updateIndicator);
    window.removeEventListener("offline", updateIndicator);
    indicator.remove();
  };
}
